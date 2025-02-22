import { Button, Gridicon } from '@automattic/components';
import { PremiumBadge } from '@automattic/design-picker';
import {
	__experimentalHStack as HStack,
	__experimentalNavigatorBackButton as NavigatorBackButton,
} from '@wordpress/components';
import { useTranslate } from 'i18n-calypso';
import DocumentHead from 'calypso/components/data/document-head';
import './style.scss';

interface Props {
	title: string;
	description?: string;
	hideBack?: boolean;
	isPremium?: boolean;
	onBack?: () => void;
}

const NavigatorHeader = ( { title, description, hideBack, isPremium, onBack }: Props ) => {
	const translate = useTranslate();

	return (
		<>
			<DocumentHead title={ title } />
			<div className="navigator-header">
				<HStack className="navigator-header__heading" spacing={ 2 } justify="flex-start">
					{ ! hideBack && (
						<NavigatorBackButton
							as={ Button }
							title={ translate( 'Back' ) }
							borderless={ true }
							aria-label={ translate( 'Navigate to the previous view' ) }
							onClick={ onBack }
						>
							<Gridicon icon="chevron-left" size={ 16 } />
						</NavigatorBackButton>
					) }
					<h2>{ title }</h2>
					{ isPremium && <PremiumBadge shouldHideTooltip /> }
				</HStack>
				{ description && <p className="navigator-header__description">{ description }</p> }
			</div>
		</>
	);
};

export default NavigatorHeader;
