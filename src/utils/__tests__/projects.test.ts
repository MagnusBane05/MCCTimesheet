import { describe, it, expect } from 'vitest';
import { getProjectDisplayName, getUniqueCustomers, getDefaultProjectIdForCustomer } from '../projects';
import type { Project } from '../../domain/project';

function project(overrides: Partial<Project> = {}): Project {
  return {
    id: 1,
    customer: 'Acme',
    name: 'Kitchen Cabinets',
    projectNumber: 'P-001',
    active: true,
    productionStatus: 'ON_DECK',
    ...overrides,
  };
}

describe('getProjectDisplayName', () => {
  it('uses the project name when there is one', () => {
    expect(getProjectDisplayName(project())).toBe('Kitchen Cabinets');
  });

  it('falls back to the customer when the name is empty', () => {
    expect(getProjectDisplayName(project({ name: '' }))).toBe('Work for Acme');
  });
});

describe('getUniqueCustomers', () => {
  it('removes duplicates, keeping first-seen order', () => {
    const projects = [
      project({ id: 1, customer: 'Acme' }),
      project({ id: 2, customer: 'Birch Co' }),
      project({ id: 3, customer: 'Acme' }),
    ];
    expect(getUniqueCustomers(projects)).toEqual(['Acme', 'Birch Co']);
  });

  it('returns an empty list for no projects', () => {
    expect(getUniqueCustomers([])).toEqual([]);
  });
});

describe('getDefaultProjectIdForCustomer', () => {
  it('returns the project id when the customer has exactly one project', () => {
    const projects = [project({ id: 1, customer: 'Acme' }), project({ id: 2, customer: 'Birch Co' })];
    expect(getDefaultProjectIdForCustomer('Birch Co', projects)).toBe(2);
  });

  it('returns null when the customer has multiple projects', () => {
    const projects = [project({ id: 1, customer: 'Acme' }), project({ id: 2, customer: 'Acme' })];
    expect(getDefaultProjectIdForCustomer('Acme', projects)).toBeNull();
  });

  it('returns null when the customer has no projects', () => {
    expect(getDefaultProjectIdForCustomer('Birch Co', [project({ customer: 'Acme' })])).toBeNull();
  });
});
