import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import userEvent from '@testing-library/user-event';

import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { IntlProvider } from '@edx/frontend-platform/i18n';

import { axe } from 'jest-axe';
import CurrentContentHighlightItemsHeader from '../CurrentContentHighlightItemsHeader';
import { accessibilitySettings } from '../../../../tests/accessibility-settings';

jest.mock('../DeleteHighlightSet', () => ({
  __esModule: true,
  default: () => <div data-testid="deleteHighlightSet" />,
}));

const highlightSetUUID = 'fake-uuid';
const highlightTitle = 'fake-title';
const CurrentContentHighlightItemsHeaderWrapper = (props) => (
  <IntlProvider locale="en">
    <MemoryRouter initialEntries={[`/test-enterprise/admin/content-highlights/${highlightSetUUID}`]}>
      <Routes>
        <Route
          path="/:enterpriseSlug/admin/content-highlights/:highlightSetUUID"
          element={<CurrentContentHighlightItemsHeader {...props} />}
        />
      </Routes>
    </MemoryRouter>
  </IntlProvider>
);

describe('<CurrentContentHighlightItemsHeader>', () => {
  it('has no accessibility violations', async () => {
    const { container } = render(
      <CurrentContentHighlightItemsHeaderWrapper isLoading={false} highlightTitle={highlightTitle} />,
    );
    const results = await axe(container, accessibilitySettings);
    expect(results).toHaveNoViolations();
  });

  it('Displays all content data titles', () => {
    render(
      <CurrentContentHighlightItemsHeaderWrapper isLoading={false} highlightTitle={highlightTitle} />,
    );
    expect(screen.getByText(highlightTitle)).toBeInTheDocument();
    expect(screen.getByTestId('deleteHighlightSet')).toBeInTheDocument();
  });
  it('Displays Skeleton on load', () => {
    render(
      <CurrentContentHighlightItemsHeaderWrapper isLoading highlightTitle={highlightTitle} />,
    );
    expect(screen.queryByText(highlightTitle)).not.toBeInTheDocument();
    expect(screen.getByTestId('header-skeleton')).toBeInTheDocument();
  });

  it('shows edit button when onSaveTitle is provided', () => {
    const onSaveTitle = jest.fn();
    render(
      <CurrentContentHighlightItemsHeaderWrapper
        isLoading={false}
        highlightTitle={highlightTitle}
        onSaveTitle={onSaveTitle}
      />,
    );
    expect(screen.getByTestId('edit-highlight-title-button')).toBeInTheDocument();
  });

  it('hides edit button when onSaveTitle is not provided', () => {
    render(
      <CurrentContentHighlightItemsHeaderWrapper
        isLoading={false}
        highlightTitle={highlightTitle}
        onSaveTitle={null}
      />,
    );
    expect(screen.queryByTestId('edit-highlight-title-button')).not.toBeInTheDocument();
  });

  it('opens edit modal when edit button is clicked', async () => {
    const user = userEvent.setup();
    const onSaveTitle = jest.fn();
    render(
      <CurrentContentHighlightItemsHeaderWrapper
        isLoading={false}
        highlightTitle={highlightTitle}
        onSaveTitle={onSaveTitle}
      />,
    );
    const editButton = screen.getByTestId('edit-highlight-title-button');
    await user.click(editButton);
    expect(screen.getByTestId('edit-highlight-title-input')).toBeInTheDocument();
  });
});
