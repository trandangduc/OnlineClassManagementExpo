export class Course {
  constructor(id, title, description, teacherId, teacherName) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.teacherId = teacherId;
    this.teacherName = teacherName;
    this.students = {};
    this.createdAt = Date.now();
    this.updatedAt = Date.now();
  }

  toDatabase() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      teacherId: this.teacherId,
      teacherName: this.teacherName,
      students: this.students,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  static fromDatabase(data) {
    const course = new Course(
      data.id,
      data.title,
      data.description,
      data.teacherId,
      data.teacherName
    );
    course.students = data.students || {};
    course.createdAt = data.createdAt;
    course.updatedAt = data.updatedAt;
    return course;
  }

  getStudentsArray() {
    return Object.keys(this.students || {});
  }

  getStudentCount() {
    return this.getStudentsArray().length;
  }

  isStudentEnrolled(userId) {
    return !!(this.students && this.students[userId]);
  }

  isOwnedBy(userId) {
    return this.teacherId === userId;
  }

  addStudent(userId) {
    if (!this.students) {
      this.students = {};
    }
    this.students[userId] = true;
    this.updatedAt = Date.now();
  }

  removeStudent(userId) {
    if (this.students && this.students[userId]) {
      delete this.students[userId];
      this.updatedAt = Date.now();
    }
  }
}