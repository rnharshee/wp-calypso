/* eslint-disable import/no-extraneous-dependencies */
import {
	CheckoutFormSubmit,
	CheckoutProvider,
	CheckoutStep,
	CheckoutStepGroup,
	FormStatus,
	PaymentMethodStep,
	getDefaultOrderReviewStep,
	makeSuccessResponse,
	useFormStatus,
	useIsStepActive,
	useSetStepComplete,
} from '@automattic/composite-checkout';
import styled from '@emotion/styled';
import { useState, useEffect, useMemo, useRef } from 'react';
import { createPayPalMethod } from './pay-pal';

const initialItems = [
	{
		label: 'WordPress.com Personal Plan',
		id: 'wpcom-personal',
		type: 'plan',
		amount: { currency: 'USD', value: 6000, displayValue: '$60' },
	},
	{
		label: 'Domain registration',
		sublabel: 'example.com',
		id: 'wpcom-domain',
		type: 'domain',
		amount: { currency: 'USD', value: 0, displayValue: '$0' },
	},
];

const onPaymentComplete = () => {
	window.alert( 'Your payment is complete!' );
};

async function payPalProcessor( data: unknown ) {
	window.console.log( 'Processing PayPal transaction with data', data );
	// This simulates the transaction and provisioning time
	await asyncTimeout( 2000 );
	return makeSuccessResponse( { success: true } );
}

const getTotal = ( items: typeof initialItems ) => {
	const lineItemTotal = items.reduce( ( sum, item ) => sum + item.amount.value, 0 );
	const currency = items.reduce( ( lastCurrency, item ) => item.amount.currency, 'USD' );
	return {
		id: 'total',
		type: 'total',
		label: 'Total',
		amount: {
			currency,
			value: lineItemTotal,
			displayValue: formatValueForCurrency( currency, lineItemTotal ),
		},
	};
};

const ContactFormTitle = () => {
	const isActive = useIsStepActive();
	return isActive ? <>Enter your contact details</> : <>Contact details</>;
};

const Label = styled.label`
	display: block;
	color: black;
	font-weight: 400;
	font-size: 14px;
	margin-bottom: 8px;
`;

const Input = styled.input`
	display: block;
	width: 100%;
	box-sizing: border-box;
	font-size: 16px;
	border: 1px solid black;
	padding: 13px 10px 12px 10px;
`;

const Form = styled.div`
	margin-bottom: 0.5em;
`;

function getInitialContactStoreData() {
	return {
		country: {
			value: '',
			error: '',
		},
	};
}

const contactStore = {
	subscribers: [],
	data: getInitialContactStoreData(),
	getData() {
		return contactStore.data;
	},
	subscribe( callback: () => void ): () => void {
		contactStore.subscribers.push( callback );
		return () => {
			contactStore.subscribers = contactStore.subscribers.filter(
				( client ) => client !== callback
			);
		};
	},
	notify() {
		setTimeout( () => contactStore.subscribers.forEach( ( callback ) => callback() ) );
	},
};

function resetContactStore() {
	contactStore.data = getInitialContactStoreData();
	contactStore.notify();
}

function setCountry( value: string ) {
	contactStore.data.country.value = value;
	contactStore.notify();
}

function setCountryError( error: string ) {
	contactStore.data.country.error = error;
	contactStore.notify();
}

function useCountry() {
	const [ state, setState ] = useState( contactStore.getData().country );
	useEffect( () => {
		return contactStore.subscribe( () => {
			const { value, error } = contactStore.getData().country;
			setState( { value, error } );
		} );
	}, [] );
	return state;
}

function ContactFormSummary() {
	const { value } = useCountry();

	return (
		<div>
			<div>Country</div>
			<span>{ value }</span>
		</div>
	);
}

function ContactForm( { preFilledCountry }: { preFilledCountry?: string } ) {
	const onChangeCountry = ( event ) => setCountry( event.target.value );
	const { formStatus } = useFormStatus();
	const { value, error } = useCountry();
	usePrefilledCountry( preFilledCountry );

	return (
		<Form>
			<Label htmlFor="country">Country</Label>
			<Input
				id="country"
				type="text"
				value={ value }
				onChange={ onChangeCountry }
				disabled={ formStatus !== FormStatus.READY }
			/>
			{ error && <p>{ error }</p> }
		</Form>
	);
}

const reviewOrderStep = getDefaultOrderReviewStep();

function usePrefilledCountry( preFilledCountry?: string ) {
	const setStepComplete = useSetStepComplete();
	const didRun = useRef( false );

	useEffect( () => {
		if ( didRun.current ) {
			return;
		}
		didRun.current = true;
		if ( ! preFilledCountry ) {
			setCountry( '' );
		}
		if ( preFilledCountry ) {
			setCountry( preFilledCountry );
			// In order for the isCompleteCallback closure to get access to the
			// updated country and therefore to pass when we try to complete step 2,
			// we have to wait for a render to occur. Therefore we use setTimeout to
			// defer the calls to setStepComplete.
			setTimeout( () => {
				setStepComplete( 'contact-form' );
			} );
		}
	}, [ preFilledCountry, setStepComplete ] );
}

function CheckoutDemo( { preFilledCountry }: { preFilledCountry?: string } ) {
	const [ items ] = useState( initialItems );
	const total = useMemo( () => getTotal( items ), [ items ] );
	const [ isLoading, setIsLoading ] = useState( true );

	useEffect( () => {
		resetContactStore();
	}, [] );

	useEffect( () => {
		// This simulates an additional loading delay
		setTimeout( () => setIsLoading( false ), 1500 );
	}, [] );

	const payPalMethod = useMemo( () => {
		return createPayPalMethod();
	}, [] );

	return (
		<CheckoutProvider
			items={ items }
			total={ total }
			onPaymentComplete={ onPaymentComplete }
			isLoading={ isLoading }
			paymentMethods={ [ payPalMethod ] }
			paymentProcessors={ { paypal: payPalProcessor } }
			initiallySelectedPaymentMethodId={ payPalMethod.id }
		>
			<MyCheckoutBody preFilledCountry={ preFilledCountry } />
		</CheckoutProvider>
	);
}

function MyCheckoutBody( { preFilledCountry }: { preFilledCountry?: string } ) {
	const { value } = useCountry();

	return (
		<CheckoutStepGroup>
			<CheckoutStep
				stepId="review-order-step"
				isCompleteCallback={ () => true }
				activeStepContent={ reviewOrderStep.activeStepContent }
				completeStepContent={ reviewOrderStep.completeStepContent }
				titleContent={ reviewOrderStep.titleContent }
			/>
			<CheckoutStep
				stepId="contact-form"
				isCompleteCallback={ () =>
					new Promise( ( resolve ) =>
						// Simulate async validation
						setTimeout( () => {
							if ( value.trim() === '' || value.trim().toLowerCase() === 'unknown' ) {
								setCountryError( 'Invalid country' );
								resolve( false );
								return;
							}
							setCountryError( '' );
							resolve( true );
						}, 1500 )
					)
				}
				activeStepContent={ <ContactForm preFilledCountry={ preFilledCountry } /> }
				completeStepContent={ <ContactFormSummary /> }
				titleContent={ <ContactFormTitle /> }
			/>
			<PaymentMethodStep />
			<CheckoutFormSubmit />
		</CheckoutStepGroup>
	);
}

function formatValueForCurrency( currency: string, value: number ): string {
	if ( currency !== 'USD' ) {
		throw new Error( `Unsupported currency ${ currency }'` );
	}
	const floatValue = value / 100;
	return '$' + floatValue.toString();
}

// Simulate network request time
async function asyncTimeout( timeout: number ) {
	return new Promise( ( resolve ) => setTimeout( resolve, timeout ) );
}

export default {
	title: 'composite-checkout',
	component: CheckoutDemo,
};

export const Basic = () => <CheckoutDemo />;
export const Prefilled = () => <CheckoutDemo preFilledCountry="Canada" />;
export const PrefilledFailure = () => <CheckoutDemo preFilledCountry="Unknown" />;
