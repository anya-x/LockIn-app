import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatCard from '../StatCard';
import { CheckCircle } from '@mui/icons-material';

describe('StatCard Component', () => {
  it('renders stat card with value and label', () => {
    render(
      <StatCard
        label="Tasks Completed"
        value={42}
        color="#4CAF50"
        icon={<CheckCircle />}
      />
    );

    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('Tasks Completed')).toBeInTheDocument();
  });

  it('shows loading spinner when loading prop is true', () => {
    render(
      <StatCard
        label="Tasks Completed"
        value={42}
        color="#4CAF50"
        icon={<CheckCircle />}
        loading={true}
      />
    );

    // When loading, value and label should not be shown
    expect(screen.queryByText('42')).not.toBeInTheDocument();
    expect(screen.queryByText('Tasks Completed')).not.toBeInTheDocument();

    // Should show loading spinner
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders with zero value', () => {
    render(
      <StatCard
        label="Failed Tasks"
        value={0}
        color="#F44336"
        icon={<CheckCircle />}
      />
    );

    expect(screen.getByText('0')).toBeInTheDocument();
  });
});
