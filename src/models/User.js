export class User {
  constructor(uid, email, role, profile = {}) {
    this.uid = uid;
    this.email = email;
    this.role = role;
    this.profile = profile;
    this.createdAt = Date.now();
  }

  toDatabase() {
    return {
      uid: this.uid,
      email: this.email,
      role: this.role,
      profile: this.profile,
      createdAt: this.createdAt
    };
  }

  static fromDatabase(data) {
    const user = new User(data.uid, data.email, data.role, data.profile);
    user.createdAt = data.createdAt;
    return user;
  }

  isTeacher() {
    return this.role === 'teacher';
  }

  isStudent() {
    return this.role === 'student';
  }

  getDisplayName() {
    return this.profile?.name || this.email;
  }
}