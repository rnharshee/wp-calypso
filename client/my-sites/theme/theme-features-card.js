import { Card } from '@automattic/components';
import { localize } from 'i18n-calypso';
import { get, isEmpty } from 'lodash';
import { connect } from 'react-redux';
import QueryThemeFilters from 'calypso/components/data/query-theme-filters';
import SectionHeader from 'calypso/components/section-header';
import { isAmbiguousThemeFilterTerm } from 'calypso/state/themes/selectors';

const ThemeFeaturesCard = ( { isWpcomTheme, siteSlug, features, translate, onClick } ) => {
	if ( isEmpty( features ) ) {
		return null;
	}

	return (
		<div>
			<QueryThemeFilters />
			<SectionHeader label={ translate( 'Features' ) } />
			<Card>
				<ul className="theme__sheet-features-list">
					{ features.map( ( { name, slug, term } ) => (
						<li
							key={ 'theme-features-item-' + slug }
							role="presentation"
							onClick={ () => onClick?.( slug ) }
						>
							{ ! isWpcomTheme ? (
								<span>{ name }</span>
							) : (
								<a href={ `/themes/filter/${ term }/${ siteSlug || '' }` }>{ name }</a>
							) }
						</li>
					) ) }
				</ul>
			</Card>
		</div>
	);
};

export default connect( ( state, { taxonomies } ) => {
	// eslint-disable-next-line wpcalypso/redux-no-bound-selectors
	const features = get( taxonomies, 'theme_feature', [] ).map( ( { name, slug } ) => {
		const term = isAmbiguousThemeFilterTerm( state, slug ) ? `feature:${ slug }` : slug;
		return { name, slug, term };
	} );
	return { features };
} )( localize( ThemeFeaturesCard ) );
