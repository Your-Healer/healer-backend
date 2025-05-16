export default class AppointmentService {
  private static instance: AppointmentService
  private constructor() {}

  static getInstance() {
    if (!AppointmentService.instance) {
      AppointmentService.instance = new AppointmentService()
    }
    return AppointmentService.instance
  }

  async getAllAppointments({
    page = 1,
    limit = 10,
    roomId,
    fromTime,
    toTime,
    doctorId
  }: {
    page?: number
    limit?: number
    search?: string
    roomId?: number
    fromTime?: Date
    toTime?: Date
    doctorId?: number
  }) {
    try {
    } catch (error) {}
  }
}
