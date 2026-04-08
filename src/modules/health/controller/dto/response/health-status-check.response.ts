export class HealthStatusCheckResponse {
	public componentType: string;

	public componentId?: string;

	public observedValue?: string | number | object;

	public observedUnit?: string;

	public status: string;

	public time?: Date;

	public output?: string;

	constructor({
		componentType,
		componentId,
		observedValue,
		observedUnit,
		status,
		time,
		output,
	}: HealthStatusCheckResponse) {
		this.componentType = componentType;
		this.componentId = componentId;
		this.observedValue = observedValue;
		this.observedUnit = observedUnit;
		this.status = status;
		this.time = time;
		this.output = output;
	}
}
