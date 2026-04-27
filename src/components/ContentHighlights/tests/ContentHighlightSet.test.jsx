import algoliasearch from 'algoliasearch/lite';
import React, { useState } from 'react';
import '@testing-library/jest-dom/extend-expect';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { Provider } from 'react-redux';
import Router, { Route } from 'react-router-dom';
import { renderHook, waitFor } from '@testing-library/react';
import { IntlProvider } from '@edx/frontend-platform/i18n';
import { camelCaseObject } from '@edx/frontend-platform';
import { logError } from '@edx/frontend-platform/logging';
import { ContentHighlightsContext } from '../ContentHighlightsContext';
import ContentHighlightSet from '../ContentHighlightSet';
import { useHighlightSet } from '../data/hooks';
import { ROUTE_NAMES } from '../../EnterpriseApp/data/constants';
import EnterpriseCatalogApiService from '../../../data/services/EnterpriseCatalogApiService';
import { EnterpriseAppContext } from '../../EnterpriseApp/EnterpriseAppContextProvider';
import { TEST_COURSE_HIGHLIGHTS_DATA } from '../data/constants';
import { configuration } from '../../../config';

jest.mock('../../../data/services/EnterpriseCatalogApiService');
jest.mock('@edx/frontend-platform/logging');

const mockHighlightSetResponse = camelCaseObject(TEST_COURSE_HIGHLIGHTS_DATA);
const mockStore = configureMockStore([thunk]);
const highlightSetUUID = 'fake-uuid';
const searchClient = algoliasearch(
  configuration.ALGOLIA.APP_ID,
  configuration.ALGOLIA.SEARCH_API_KEY,
);

const initialState = {
  portalConfiguration: {
    enterpriseSlug: 'test-enterprise',
  },
  highlightSetUUID,
};
const mockDispatchFn = jest.fn();
const initialEnterpriseAppContextValue = {
  enterpriseCuration: {
    dispatch: mockDispatchFn,
  },
};
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const ContentHighlightSetWrapper = (
  enterpriseAppContextValue = initialEnterpriseAppContextValue,
  { children },
  ...props
) => {
  /* eslint-enable react/prop-types */
  const contextValue = useState({
    stepperModal: {
      isOpen: false,
      highlightTitle: null,
      titleStepValidationError: null,
      currentSelectedRowIds: {},
    },
    contentHighlights: [],
    algolia: {
      searchClient,
      securedAlgoliaApiKey: null,
      isLoading: false,
    },
  });
  return (
    <IntlProvider locale="en">
      <EnterpriseAppContext.Provider value={enterpriseAppContextValue}>
        <ContentHighlightsContext.Provider value={contextValue}>
          <Provider store={mockStore(initialState)}>
            {children}
            <Route
              path={`/:enterpriseSlug/admin/${ROUTE_NAMES.contentHighlights}/:highlightSetUUID`}
              render={routeProps => <ContentHighlightSet {...routeProps} {...props} />}
            />
          </Provider>
        </ContentHighlightsContext.Provider>
      </EnterpriseAppContext.Provider>
    </IntlProvider>
  );
};

describe('<ContentHighlightSet>', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Displays the title of the highlight set', async () => {
    jest.spyOn(Router, 'useParams').mockReturnValue({ highlightSetUUID });
    EnterpriseCatalogApiService.fetchHighlightSet.mockResolvedValueOnce({
      data: mockHighlightSetResponse,
    });
    const { result } = renderHook(() => useHighlightSet(highlightSetUUID));
    expect(result.current).toEqual({
      isLoading: true,
      error: null,
      highlightSet: [],
      updateHighlightSet: expect.any(Function),
      updateHighlightTitle: expect.any(Function),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current).toEqual({
      isLoading: false,
      error: null,
      highlightSet: camelCaseObject(TEST_COURSE_HIGHLIGHTS_DATA),
      updateHighlightSet: expect.any(Function),
      updateHighlightTitle: expect.any(Function),
    });
    expect(
      EnterpriseCatalogApiService.fetchHighlightSet,
    ).toHaveBeenCalled();
  });

  it('updateHighlightTitle patches the title and updates highlight set state', async () => {
    jest.spyOn(Router, 'useParams').mockReturnValue({ highlightSetUUID });
    const updatedData = { ...mockHighlightSetResponse, title: 'Updated Title' };
    EnterpriseCatalogApiService.fetchHighlightSet.mockResolvedValueOnce({ data: mockHighlightSetResponse });
    EnterpriseCatalogApiService.updateHighlightSet.mockResolvedValueOnce({ data: updatedData });

    const { result } = renderHook(() => useHighlightSet(highlightSetUUID));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const updateResult = await result.current.updateHighlightTitle('Updated Title');

    expect(EnterpriseCatalogApiService.updateHighlightSet).toHaveBeenCalledWith(
      highlightSetUUID,
      { title: 'Updated Title' },
    );
    await waitFor(() => expect(result.current.highlightSet.title).toBe('Updated Title'));
    expect(updateResult.title).toBe('Updated Title');
  });

  it('updateHighlightTitle sets error state and rethrows on failure', async () => {
    jest.spyOn(Router, 'useParams').mockReturnValue({ highlightSetUUID });
    const updateError = new Error('Update failed');
    EnterpriseCatalogApiService.fetchHighlightSet.mockResolvedValueOnce({ data: mockHighlightSetResponse });
    EnterpriseCatalogApiService.updateHighlightSet.mockRejectedValueOnce(updateError);

    const { result } = renderHook(() => useHighlightSet(highlightSetUUID));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await expect(result.current.updateHighlightTitle('New Title')).rejects.toThrow(updateError);
    await waitFor(() => expect(result.current.error).toBe(updateError));
    expect(logError).not.toHaveBeenCalled();
  });

  it('passes editHighlightsEnabled=true when feature flag is enabled in Redux state', () => {
    const stateWithFeatureFlagEnabled = {
      ...initialState,
      portalConfiguration: {
        ...initialState.portalConfiguration,
        enterpriseFeatures: {
          enterpriseEditHighlightsEnabled: true,
        },
      },
    };
    const store = mockStore(stateWithFeatureFlagEnabled);
    expect(store.getState().portalConfiguration.enterpriseFeatures.enterpriseEditHighlightsEnabled).toBe(true);
  });

  it('passes editHighlightsEnabled=false when feature flag is disabled in Redux state', () => {
    const stateWithFeatureFlagDisabled = {
      ...initialState,
      portalConfiguration: {
        ...initialState.portalConfiguration,
        enterpriseFeatures: {
          enterpriseEditHighlightsEnabled: false,
        },
      },
    };
    const store = mockStore(stateWithFeatureFlagDisabled);
    expect(store.getState().portalConfiguration.enterpriseFeatures.enterpriseEditHighlightsEnabled).toBe(false);
  });

  it('defaults editHighlightsEnabled to false when feature flag is missing', () => {
    const stateWithoutFeatureFlag = {
      ...initialState,
      portalConfiguration: {
        ...initialState.portalConfiguration,

      },
    };
    const store = mockStore(stateWithoutFeatureFlag);
    const state = store.getState();
    const defaultValue = state.portalConfiguration.enterpriseFeatures?.enterpriseEditHighlightsEnabled ?? false;
    expect(defaultValue).toBe(false);
  });
});
