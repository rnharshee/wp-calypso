import { Button, Gridicon } from '@automattic/components';
import styled from '@emotion/styled';
import { TextControl } from '@wordpress/components';
import { useTranslate } from 'i18n-calypso';
import { useState, FormEvent, useEffect } from 'react';
import { useCheckSiteTransferEligibility } from './use-check-site-transfer-eligibility';

const Strong = styled( 'strong' )( {
	fontWeight: 500,
} );

const FormText = styled( 'p' )( {
	fontSize: '14px',
} );

const TextControlContainer = styled.div( {
	marginBottom: '2em',
	label: {
		textTransform: 'none',
		fontSize: '14px',
		color: 'black',
	},
} );

const ButtonStyled = styled( Button )( {
	marginBottom: '1em',
} );

const Error = styled.div( {
	display: 'flex',
	alignItems: 'center',
	color: 'red',
} );

const ErrorText = styled.p( {
	margin: 0,
	marginLeft: '0.4em',
	fontSize: '100%',
} );

const SiteOwnerTransferEligibility = ( {
	siteId,
	siteSlug,
	siteOwner,
	onNewUserOwnerSubmit,
}: {
	siteId: number;
	siteSlug: string;
	siteOwner: string;
	onNewUserOwnerSubmit: ( user: string ) => void;
} ) => {
	const translate = useTranslate();
	const [ tempSiteOwner, setTempSiteOwner ] = useState( siteOwner );
	const [ siteTransferEligibilityError, setSiteTransferEligibilityError ] = useState( '' );

	const { checkSiteTransferEligibility, isLoading: isCheckingSiteTransferEligibility } =
		useCheckSiteTransferEligibility( siteId, {
			onMutate: () => {
				setSiteTransferEligibilityError( '' );
			},
			onError: ( e ) => {
				setSiteTransferEligibilityError( e.message );
			},
			onSuccess: () => {
				onNewUserOwnerSubmit?.( tempSiteOwner || '' );
			},
		} );

	useEffect( () => {
		setTempSiteOwner( siteOwner );
	}, [ siteOwner ] );

	const handleFormSubmit = ( event: FormEvent< HTMLFormElement > ) => {
		event.preventDefault();
		if ( ! tempSiteOwner ) {
			return;
		}
		checkSiteTransferEligibility( { newSiteOwner: tempSiteOwner } );
	};

	return (
		<form onSubmit={ handleFormSubmit }>
			<FormText>
				{ translate(
					'Please enter the username or email address of the registered WordPress.com user that you want to transfer ownership of {{strong}}%(siteSlug)s{{/strong}} to:',
					{
						args: { siteSlug },
						components: { strong: <Strong /> },
					}
				) }
			</FormText>
			<TextControlContainer>
				<TextControl
					autoComplete="off"
					label={ translate( 'Username or email address' ) }
					value={ tempSiteOwner }
					onChange={ ( value ) => setTempSiteOwner( value ) }
				/>
				{ siteTransferEligibilityError && (
					<Error>
						<Gridicon icon="notice-outline" size={ 16 } />
						<ErrorText>{ siteTransferEligibilityError }</ErrorText>
					</Error>
				) }
			</TextControlContainer>
			<ButtonStyled
				busy={ isCheckingSiteTransferEligibility }
				primary
				disabled={ ! tempSiteOwner || isCheckingSiteTransferEligibility }
				type="submit"
			>
				{ translate( 'Search user and continue' ) }
			</ButtonStyled>
		</form>
	);
};

export default SiteOwnerTransferEligibility;
