export class User {
  constructor(
    public readonly id:        string,   // Firebase UID
    public readonly email:     string,
    public readonly name:      string,
    public readonly createdAt: Date,
  ) {}
}
