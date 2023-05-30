import { authConfig } from '@src/lib/constants';
import { routeGuard } from '../../..';

export const onRequest = [routeGuard(authConfig)];
