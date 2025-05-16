export class ResponseFailureModel {
  constructor(
    public status: number,
    public error: any,
    public message: string,
  ) {}
}
