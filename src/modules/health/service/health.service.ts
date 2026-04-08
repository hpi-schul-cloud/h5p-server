import { Injectable } from '@nestjs/common';

import { HealthCheck } from '../domain';
import { HealthCheckRepo } from '../repo';

@Injectable()
export class HealthService {
	constructor(private readonly healthCheckRepo: HealthCheckRepo) {}

	public upsertHealthCheckById(id: string): Promise<HealthCheck> {
		return this.healthCheckRepo.upsertById(id);
	}
}
