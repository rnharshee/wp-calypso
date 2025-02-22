import { useTranslate } from 'i18n-calypso';
import FormCheckbox from 'calypso/components/forms/form-checkbox';
import { Subscriber } from '../../types';
import { SubscriberRow } from './subscriber-row';
import './styles.scss';

type SubscriberListProps = {
	subscribers: Subscriber[];
};

const noop = () => undefined;

export const SubscriberList = ( { subscribers }: SubscriberListProps ) => {
	const translate = useTranslate();
	return (
		<ul className="subscriber-list" role="table">
			<li className="row header" role="row">
				<span className="subscriber-list__checkbox-column hidden" role="columnheader">
					<FormCheckbox />
				</span>
				<span className="subscriber-list__profile-column" role="columnheader">
					{ translate( 'Name' ) }
				</span>
				<span className="subscriber-list__subscription-type-column hidden" role="columnheader">
					{ translate( 'Subscription type' ) }
				</span>
				<span className="subscriber-list__rate-column hidden" role="columnheader">
					{ translate( 'Open Rate' ) }
				</span>
				<span className="subscriber-list__since-column" role="columnheader">
					{ translate( 'Since' ) }
				</span>
				<span className="subscriber-list__menu-column" role="columnheader"></span>
			</li>
			{ subscribers.map( ( subscriber ) => (
				<SubscriberRow
					key={ subscriber.subscription_id }
					subscriber={ subscriber }
					onView={ noop }
					onUnsubscribe={ noop }
				/>
			) ) }
		</ul>
	);
};
