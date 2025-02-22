import { SubscriptionManager, Reader } from '@automattic/data-stores';
import { useLocale } from '@automattic/i18n-utils';
import { Button } from '@wordpress/components';
import { useTranslate, numberFormat } from 'i18n-calypso';
import { useEffect, useState, useMemo } from 'react';
import ExternalLink from 'calypso/components/external-link';
import FormattedHeader from 'calypso/components/formatted-header';
import TimeSince from 'calypso/components/time-since';
import { Notice, NoticeState, NoticeType } from 'calypso/landing/subscriptions/components/notice';
import { SiteIcon } from 'calypso/landing/subscriptions/components/site-icon';
import {
	PaymentPlan,
	SiteSubscriptionDetailsProps,
	formatRenewalDate,
	formatRenewalPrice,
	getPaymentInterval,
} from './site-subscription-helpers';
import SiteSubscriptionSettings from './site-subscription-settings';
import './styles.scss';

const SiteSubscriptionDetails = ( {
	subscriberCount,
	dateSubscribed,
	siteIcon,
	name,
	blogId,
	deliveryMethods,
	url,
	paymentDetails,
}: SiteSubscriptionDetailsProps ) => {
	const translate = useTranslate();
	const localeSlug = useLocale();
	const [ notice, setNotice ] = useState< NoticeState | null >( null );

	const {
		mutate: subscribe,
		isLoading: subscribing,
		isSuccess: subscribed,
		error: subscribeError,
	} = SubscriptionManager.useSiteSubscribeMutation( blogId );
	const {
		mutate: unsubscribe,
		isLoading: unsubscribing,
		isSuccess: unsubscribed,
		error: unsubscribeError,
	} = SubscriptionManager.useSiteUnsubscribeMutation( blogId );

	const confirmUnsubscribe = ( { blogId, url }: { blogId: string; url: string } ) => {
		if (
			confirm(
				'You currently have paid subscriptions with this site. Paid subscriptions must be cancelled separately by clicking the Manage Subscriptions button or going to https://wordpress.com/me/purchases.\n\nPress OK to proceed with unsubscribing from the site.\nPress Cancel to go back.'
			)
		) {
			unsubscribe( { blog_id: blogId, url } );
		}
	};

	const [ paymentPlans, setPaymentPlans ] = useState< PaymentPlan[] >( [] );

	const [ siteSubscribed, setSiteSubscribed ] = useState( true );
	useEffect( () => {
		if ( subscribed ) {
			setSiteSubscribed( true );
		}
	}, [ subscribed ] );

	useEffect( () => {
		if ( unsubscribed ) {
			setSiteSubscribed( false );
		}
	}, [ unsubscribed ] );

	useEffect( () => {
		if ( paymentDetails ) {
			const newPaymentPlans: PaymentPlan[] = [];

			paymentDetails.forEach( ( paymentDetail: Reader.SiteSubscriptionPaymentDetails ) => {
				const { ID, currency, renewal_price, renew_interval } = paymentDetail;
				const renewalPrice = formatRenewalPrice( renewal_price, currency );
				const when = getPaymentInterval( renew_interval );
				const renewalDate = formatRenewalDate( paymentDetail.end_date, localeSlug );

				newPaymentPlans.push( {
					id: ID,
					renewalPrice: `${ renewalPrice }${ when }`,
					renewalDate,
				} );
			} );

			setPaymentPlans( newPaymentPlans );
		}
	}, [ paymentDetails ] );

	const subscriberCountText = subscriberCount
		? translate( '%s subscriber', '%s subscribers', {
				count: subscriberCount,
				args: [ numberFormat( subscriberCount, 0 ) ],
				comment: '%s is the number of subscribers. For example: "12,000,000"',
		  } )
		: '';

	const hostname = useMemo( () => {
		try {
			return new URL( url ).hostname;
		} catch ( e ) {
			return '';
		}
	}, [ url ] );

	const urlLink = hostname ? (
		<ExternalLink href={ url } rel="noreferrer noopener" target="_blank">
			{ hostname }
		</ExternalLink>
	) : (
		''
	);

	const subHeaderText = (
		<>
			{ subscriberCountText }
			{ hostname ? ' · ' : '' }
			{ urlLink }
		</>
	);

	useEffect( () => {
		// todo: style the button (underline, color?, etc.)
		const Resubscribe = () => (
			<Button
				onClick={ () => subscribe( { blog_id: blogId, url } ) }
				disabled={ subscribing || unsubscribing }
			>
				{ translate( 'Resubscribe' ) }
			</Button>
		);

		if ( siteSubscribed ) {
			setNotice( null );
		}
		if ( ! siteSubscribed && ! subscribeError ) {
			setNotice( {
				type: NoticeType.Success,
				action: <Resubscribe />,
				message: translate(
					'You have successfully unsubscribed and will no longer receive emails from %s.',
					{
						args: [ name ],
						comment: 'Name of the site that the user has unsubscribed from.',
					}
				),
			} );
		}
		if ( unsubscribeError ) {
			setNotice( {
				type: NoticeType.Error,
				onClose: () => setNotice( null ),
				message: translate( 'There was an error when trying to unsubscribe from %s.', {
					args: [ name ],
					comment: 'Name of the site that the user tried to unsubscribe from.',
				} ),
			} );
		}
		if ( subscribeError ) {
			setNotice( {
				type: NoticeType.Error,
				action: <Resubscribe />,
				message: translate( 'There was an error when trying to resubscribe to %s.', {
					args: [ name ],
					comment: 'Name of the site that the user tried to resubscribe to.',
				} ),
			} );
		}
	}, [
		siteSubscribed,
		unsubscribeError,
		subscribeError,
		subscribing,
		unsubscribing,
		translate,
		blogId,
		subscribe,
		url,
		name,
	] );

	return (
		<>
			<header className="site-subscription-page__header site-subscription-page__centered-content">
				<SiteIcon iconUrl={ siteIcon } size={ 116 } />
				<FormattedHeader brandFont headerText={ name } subHeaderText={ subHeaderText } />
			</header>

			<Notice
				onClose={ notice?.onClose }
				visible={ !! notice }
				type={ notice?.type }
				action={ notice?.action }
			>
				{ notice?.message }
			</Notice>

			{ siteSubscribed && (
				<>
					<SiteSubscriptionSettings
						blogId={ blogId }
						notifyMeOfNewPosts={ !! deliveryMethods.notification?.send_posts }
						emailMeNewPosts={ !! deliveryMethods.email?.send_posts }
						deliveryFrequency={
							deliveryMethods.email?.post_delivery_frequency ??
							Reader.EmailDeliveryFrequency.Instantly
						}
						emailMeNewComments={ !! deliveryMethods.email?.send_comments }
					/>

					<hr className="subscriptions__separator" />

					{ /* TODO: Move to SiteSubscriptionInfo component when payment details are in. */ }
					<div className="site-subscription-info">
						<h2 className="site-subscription-info__heading">{ translate( 'Subscription' ) }</h2>
						<dl className="site-subscription-info__list">
							<dt>{ translate( 'Date' ) }</dt>
							<dd>
								<TimeSince
									date={
										( dateSubscribed?.valueOf()
											? dateSubscribed
											: new Date( 0 )
										).toISOString?.() ?? dateSubscribed
									}
								/>
							</dd>
						</dl>
						{ paymentPlans &&
							paymentPlans.map( ( { id, renewalPrice, renewalDate } ) => (
								<dl className="site-subscription-info__list" key={ id }>
									<dt>{ translate( 'Plan' ) }</dt>
									<dd>{ renewalPrice }</dd>
									{ renewalDate && (
										<>
											<dt>{ translate( 'Billing period' ) }</dt>
											<dd>{ translate( 'Renews on %s', { args: [ renewalDate ] } ) }</dd>
										</>
									) }
								</dl>
							) ) }
					</div>

					<div className="site-subscription-page__button-container">
						<Button
							className="site-subscription-page__manage-button"
							isPrimary
							href="/me/purchases"
							disabled={ unsubscribing }
						>
							{ translate( 'Manage purchases' ) }
						</Button>
						<Button
							className="site-subscription-page__unsubscribe-button"
							onClick={ () => confirmUnsubscribe( { blogId, url } ) }
							disabled={ unsubscribing }
						>
							{ translate( 'Cancel subscription' ) }
						</Button>
					</div>
				</>
			) }
		</>
	);
};

export default SiteSubscriptionDetails;
