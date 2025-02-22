import { Reader } from '@automattic/data-stores';
import SearchInput from '@automattic/search';
import { useTranslate } from 'i18n-calypso';
import { useMemo } from 'react';
import SelectDropdown from 'calypso/components/select-dropdown';
import { SearchIcon } from 'calypso/landing/subscriptions/components/icons';
import { SortControls, Option } from 'calypso/landing/subscriptions/components/sort-controls';
import { getOptionLabel } from 'calypso/landing/subscriptions/helpers';
import { useSiteSubscriptionsFilterOptions } from 'calypso/landing/subscriptions/hooks/';
import { useSiteSubscriptionsManager } from './site-subscriptions-manager-context';

const { SiteSubscriptionsSortBy: SortBy } = Reader;

const getSortOptions = ( translate: ReturnType< typeof useTranslate > ) => [
	{ value: SortBy.LastUpdated, label: translate( 'Recently updated' ) },
	{ value: SortBy.DateSubscribed, label: translate( 'Recently subscribed' ) },
	{ value: SortBy.SiteName, label: translate( 'Site name' ) },
];

const ListActionsBar = () => {
	const translate = useTranslate();
	const { handleSearch, sortTerm, setSortTerm, filterOption, setFilterOption } =
		useSiteSubscriptionsManager();

	const filterOptions = useSiteSubscriptionsFilterOptions();
	const sortOptions = useMemo( () => getSortOptions( translate ), [ translate ] );

	return (
		<div className="list-actions-bar">
			<SearchInput
				placeholder={ translate( 'Search by site name or address…' ) }
				searchIcon={ <SearchIcon size={ 18 } /> }
				onSearch={ handleSearch }
			/>

			<SelectDropdown
				className="subscriptions-manager__filter-control subscriptions-manager__list-actions-bar-spacer"
				options={ filterOptions }
				onSelect={ ( selectedOption: Option< Reader.SiteSubscriptionsFilterBy > ) =>
					setFilterOption( selectedOption.value )
				}
				selectedText={ translate( 'View: %s', {
					args: getOptionLabel( filterOptions, filterOption ) || '',
				} ) }
			/>

			<SortControls options={ sortOptions } value={ sortTerm } onChange={ setSortTerm } />
		</div>
	);
};

export default ListActionsBar;
