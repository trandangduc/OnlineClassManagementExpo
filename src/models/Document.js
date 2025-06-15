export class Document {
  constructor(id, title, type, url, courseId, uploadedBy) {
    this.id = id;
    this.title = title;
    this.type = type;
    this.url = url;
    this.courseId = courseId;
    this.uploadedBy = uploadedBy;
    this.createdAt = Date.now();
    this.size = 0;
    this.description = '';
  }

  toDatabase() {
    return {
      id: this.id,
      title: this.title,
      type: this.type,
      url: this.url,
      courseId: this.courseId,
      uploadedBy: this.uploadedBy,
      createdAt: this.createdAt,
      size: this.size,
      description: this.description
    };
  }

  static fromDatabase(data) {
    const doc = new Document(
      data.id,
      data.title,
      data.type,
      data.url,
      data.courseId,
      data.uploadedBy
    );
    doc.createdAt = data.createdAt;
    doc.size = data.size;
    doc.description = data.description || '';
    return doc;
  }

  isPDF() {
    return this.type === 'pdf';
  }

  isVideo() {
    return this.type === 'video';
  }

  isLink() {
    return this.type === 'link';
  }

  getFileExtension() {
    if (this.url) {
      return this.url.split('.').pop().toLowerCase();
    }
    return '';
  }

  isUploadedFile() {
    return this.url && this.url.includes('firebase');
  }

  formatSize() {
    if (this.size < 1024) return `${this.size} B`;
    if (this.size < 1024 * 1024) return `${(this.size / 1024).toFixed(1)} KB`;
    return `${(this.size / (1024 * 1024)).toFixed(1)} MB`;
  }
}