import { StripeHookProvider } from '@automattic/calypso-stripe';
import { Modal } from '@wordpress/components';
import { getQueryArg, removeQueryArgs } from '@wordpress/url';
import { useTranslate } from 'i18n-calypso';
import { useEffect } from 'react';
import CheckoutMasterbar from 'calypso/layout/masterbar/checkout';
import { navigate } from 'calypso/lib/navigate';
import { getStripeConfiguration } from 'calypso/lib/store-transactions';
import CalypsoShoppingCartProvider from 'calypso/my-sites/checkout/calypso-shopping-cart-provider';
import CheckoutMain from 'calypso/my-sites/checkout/composite-checkout/components/checkout-main';
import { useSelector, useDispatch } from 'calypso/state';
import getPreviousRoute from 'calypso/state/selectors/get-previous-route.js';
import isAtomicSite from 'calypso/state/selectors/is-site-automated-transfer';
import { isJetpackSite } from 'calypso/state/sites/selectors';
import { setSelectedSiteId } from 'calypso/state/ui/actions';
import { getSelectedSite, getSelectedSiteId } from 'calypso/state/ui/selectors';
import { KEY_PRODUCTS } from './constants';
import type { FunctionComponent } from 'react';

import './style.scss';

export interface Props {
	title?: string;
	siteId?: number;
	productAliasFromUrl?: string;
	// IMPORTANT NOTE: This will not be called for redirect payment methods like
	// PayPal. They will redirect directly to the post-checkout page decided by
	// `getThankYouUrl`.
	checkoutOnSuccessCallback?: () => void;
	onClose?: () => void;
	navigate?: ( path: string ) => void;
}

const CheckoutModal: FunctionComponent< Props > = ( {
	title = '',
	siteId,
	productAliasFromUrl,
	checkoutOnSuccessCallback,
	onClose,
} ) => {
	const translate = useTranslate();
	const dispatch = useDispatch();
	const {
		siteSlug,
		selectedSiteId,
		hasSelectedSiteId,
		previousRoute,
		redirectTo,
		cancelTo,
		isJetpackNotAtomic,
	} = useSelector( ( state ) => {
		const site = getSelectedSite( state );
		const selectedSiteId = getSelectedSiteId( state );
		const hasSelectedSiteId = selectedSiteId && siteId === selectedSiteId;
		const previousRoute = getPreviousRoute( state );

		return {
			siteSlug: site?.slug,
			selectedSiteId,
			hasSelectedSiteId,
			previousRoute: removeQueryArgs( previousRoute, KEY_PRODUCTS ),
			redirectTo: ( getQueryArg( window.location.href, 'redirect_to' ) as string ) || previousRoute,
			cancelTo: ( getQueryArg( window.location.href, 'cancel_to' ) as string ) || previousRoute,
			isJetpackNotAtomic:
				!! isJetpackSite( state, selectedSiteId ) && ! isAtomicSite( state, selectedSiteId ),
		};
	} );

	const handleRequestClose = () => {
		onClose?.();
		navigate( cancelTo );
	};

	// IMPORTANT NOTE: This will not be called for redirect payment methods like
	// PayPal. They will redirect directly to the post-checkout page decided by
	// `getThankYouUrl`.
	const handleAfterPaymentComplete = () => {
		checkoutOnSuccessCallback?.();
		onClose?.();

		// Reload the page to get latest data
		window.location.href = redirectTo;
	};

	useEffect( () => {
		if ( ! hasSelectedSiteId && siteId ) {
			dispatch( setSelectedSiteId( siteId ) );
		}
	}, [ hasSelectedSiteId, siteId ] );

	if ( ! hasSelectedSiteId ) {
		return null;
	}

	return (
		<Modal
			open
			overlayClassName="checkout-modal"
			bodyOpenClassName="has-checkout-modal"
			title={ translate( 'Checkout modal' ) }
			shouldCloseOnClickOutside={ false }
			onRequestClose={ handleRequestClose }
		>
			<CheckoutMasterbar
				title={ title }
				siteSlug={ siteSlug }
				previousPath={ previousRoute }
				isJetpackNotAtomic={ isJetpackNotAtomic }
				isLeavingAllowed
			/>
			<CalypsoShoppingCartProvider>
				<StripeHookProvider
					fetchStripeConfiguration={ getStripeConfiguration }
					locale={ translate.localeSlug }
				>
					<CheckoutMain
						siteId={ selectedSiteId ?? undefined }
						siteSlug={ siteSlug }
						productAliasFromUrl={ productAliasFromUrl }
						// Custom thank-you URL for payments that are processed after a redirect (eg: Paypal)
						redirectTo={ redirectTo }
						customizedPreviousPath={ previousRoute }
						isInModal
						disabledThankYouPage
						onAfterPaymentComplete={ handleAfterPaymentComplete }
					/>
				</StripeHookProvider>
			</CalypsoShoppingCartProvider>
		</Modal>
	);
};

export default CheckoutModal;
