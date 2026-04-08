import { HealthStatusCheckResponse } from './health-status-check.response';

export class HealthStatusResponse {
	public status: string;

	public description?: string;

	public output?: string;

	public checks?: Record<string, HealthStatusCheckResponse[]>;

	constructor({ status, description, output, checks }: HealthStatusResponse) {
		this.status = status;
		this.description = description;
		this.output = output;
		this.checks = checks;
	}
}
