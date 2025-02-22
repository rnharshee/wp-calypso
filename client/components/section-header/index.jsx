import { CompactCard } from '@automattic/components';
import classNames from 'classnames';
import { PureComponent } from 'react';
import Count from 'calypso/components/count';

import './style.scss';

export default class SectionHeader extends PureComponent {
	static defaultProps = {
		label: '',
		href: null,
		isPlaceholder: false,
	};

	render() {
		const hasCount = 'number' === typeof this.props.count;
		const isEmpty = ! ( this.props.label || hasCount || this.props.children );
		const classes = classNames( this.props.className, 'section-header', {
			'is-empty': isEmpty,
			'is-placeholder': this.props.isPlaceholder,
		} );
		const { id } = this.props;
		const otherProps = { id };

		return (
			<CompactCard className={ classes } href={ this.props.href } { ...otherProps }>
				<div className="section-header__label">
					<span className="section-header__label-text">{ this.props.label }</span>
					{ hasCount && <Count count={ this.props.count } /> }
				</div>
				<div className="section-header__actions">{ this.props.children }</div>
			</CompactCard>
		);
	}
}
