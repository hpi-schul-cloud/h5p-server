import { HealthCheck } from '../domain';
import { HealthCheckEntity } from './entity';

export class HealthCheckRepoMapper {
	public static mapHealthCheckEntityToDO(entity: HealthCheckEntity): HealthCheck {
		return new HealthCheck(entity.id, entity.updatedAt);
	}
}
