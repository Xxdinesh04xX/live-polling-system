export type Participant = {
  studentId: string;
  name: string;
  socketId: string;
  joinedAt: number;
};

class ParticipantService {
  private participants = new Map<string, Participant>();
  private socketIndex = new Map<string, string>();
  private kicked = new Set<string>();

  isNameTaken(name: string, excludeStudentId?: string) {
    const normalized = name.trim().toLowerCase();
    for (const participant of this.participants.values()) {
      if (
        participant.studentId !== excludeStudentId &&
        participant.name.trim().toLowerCase() === normalized
      ) {
        return true;
      }
    }
    return false;
  }

  addParticipant(studentId: string, name: string, socketId: string) {
    if (this.kicked.has(studentId)) {
      return null;
    }
    const participant: Participant = {
      studentId,
      name,
      socketId,
      joinedAt: Date.now(),
    };
    this.participants.set(studentId, participant);
    this.socketIndex.set(socketId, studentId);
    return participant;
  }

  removeParticipantBySocket(socketId: string) {
    const studentId = this.socketIndex.get(socketId);
    if (!studentId) {
      return;
    }
    this.socketIndex.delete(socketId);
    this.participants.delete(studentId);
  }

  getParticipants() {
    return Array.from(this.participants.values()).sort(
      (a, b) => a.joinedAt - b.joinedAt
    );
  }

  getParticipant(studentId: string) {
    return this.participants.get(studentId) ?? null;
  }

  getActiveCount() {
    return this.participants.size;
  }

  isKicked(studentId: string) {
    return this.kicked.has(studentId);
  }

  kickParticipant(studentId: string) {
    this.kicked.add(studentId);
    const participant = this.participants.get(studentId);
    if (participant) {
      this.participants.delete(studentId);
      this.socketIndex.delete(participant.socketId);
    }
    return participant;
  }
}

export const participantService = new ParticipantService();
