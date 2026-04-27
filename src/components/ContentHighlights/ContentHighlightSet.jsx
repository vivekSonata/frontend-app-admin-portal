import { Container } from '@openedx/paragon';
import { connect } from 'react-redux';
import { useParams } from 'react-router-dom';
import React from 'react';
import PropTypes from 'prop-types';
import ContentHighlightsCardItemContainer from './ContentHighlightsCardItemsContainer';
import CurrentContentHighlightItemsHeader from './CurrentContentHighlightItemsHeader';
import { useHighlightSet } from './data/hooks';

const ContentHighlightSet = ({ editHighlightsEnabled }) => {
  const { highlightSetUUID } = useParams();
  const {
    highlightSet, isLoading, updateHighlightSet, updateHighlightTitle,
  } = useHighlightSet(highlightSetUUID);
  const onSaveTitle = editHighlightsEnabled ? updateHighlightTitle : null;

  return (
    <Container className="mt-5">
      <CurrentContentHighlightItemsHeader
        isLoading={isLoading}
        highlightTitle={highlightSet?.title}
        onSaveTitle={onSaveTitle}
      />
      <ContentHighlightsCardItemContainer
        isLoading={isLoading}
        highlightedContent={highlightSet?.highlightedContent}
        updateHighlightSet={updateHighlightSet}
      />
    </Container>
  );
};

const mapStateToProps = (state) => ({
  editHighlightsEnabled: state.portalConfiguration.enterpriseFeatures?.enterpriseEditHighlightsEnabled ?? false,
});

ContentHighlightSet.propTypes = {
  editHighlightsEnabled: PropTypes.bool,
};

export default connect(mapStateToProps)(ContentHighlightSet);
