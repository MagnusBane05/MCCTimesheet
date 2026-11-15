import { ApiError } from '../services/apiClient';

export function formatError(error: unknown, fallback = 'Something went wrong.'): string {
	if (error instanceof ApiError) return `${error.status}: ${error.message}`;
	return error instanceof Error ? error.message : fallback;
}
