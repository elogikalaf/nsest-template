export class ResponseSuccessModel {
  constructor(
    public status: number,
    public data: any,
    public message: string,
  ) {}
}
