import { APPOINTMENTSTATUS } from '@prisma/client'
import BaseService from './base.service'
import {
  AdminDashboardStats,
  DoctorDashboardStats,
  MonthlyStats,
  DepartmentStats,
  StaffPerformanceStats,
  TimeSlotUtilization
} from '../utils/types'
import prisma from '~/libs/prisma/init'

export default class StatisticService extends BaseService {
  private static instance: StatisticService

  private constructor() {
    super()
  }

  public static getInstance(): StatisticService {
    if (!StatisticService.instance) {
      StatisticService.instance = new StatisticService()
    }
    return StatisticService.instance
  }

  /**
   * Get comprehensive admin dashboard statistics
   */
  async getAdminDashboardStats(): Promise<AdminDashboardStats> {
    try {
      const now = new Date()
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const endOfDay = new Date(startOfDay)
      endOfDay.setDate(endOfDay.getDate() + 1)

      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)

      // Run all queries in parallel for better performance
      const [totalPatients, totalStaff, totalDepartments, totalMedicalRooms] = await Promise.all([
        // Total unique patients
        prisma.patient.count(),
        // Total staff members
        prisma.staff.count(),
        // Total departments
        prisma.department.count(),
        // Total medical rooms
        prisma.medicalRoom.count()
      ])

      // Appointments data
      const [
        totalAppointments,
        todayAppointmentsCount,
        todayIdleAppointments,
        todayBookedAppointments,
        todayPaidAppointments,
        todayCancelAppointments,
        todayFinishedAppointments,
        monthlyAppointmentsCount
      ] = await Promise.all([
        // Total appointments
        prisma.appointment.count(),

        // Today's appointments count
        prisma.appointment.count({
          where: {
            bookingTime: {
              medicalRoomTime: {
                fromTime: {
                  gte: startOfDay,
                  lt: endOfDay
                }
              }
            }
          }
        }),

        // Today's idle appointments
        prisma.appointment.count({
          where: {
            status: APPOINTMENTSTATUS.IDLE,
            bookingTime: {
              medicalRoomTime: {
                fromTime: {
                  gte: startOfDay,
                  lt: endOfDay
                }
              }
            }
          }
        }),

        // Today's booked appointments
        prisma.appointment.count({
          where: {
            status: APPOINTMENTSTATUS.BOOKED,
            bookingTime: {
              medicalRoomTime: {
                fromTime: {
                  gte: startOfDay,
                  lt: endOfDay
                }
              }
            }
          }
        }),

        // Today's paid appointments
        prisma.appointment.count({
          where: {
            status: APPOINTMENTSTATUS.PAID,
            bookingTime: {
              medicalRoomTime: {
                fromTime: {
                  gte: startOfDay,
                  lt: endOfDay
                }
              }
            }
          }
        }),

        // Today's cancelled appointments
        prisma.appointment.count({
          where: {
            status: APPOINTMENTSTATUS.CANCEL,
            bookingTime: {
              medicalRoomTime: {
                fromTime: {
                  gte: startOfDay,
                  lt: endOfDay
                }
              }
            }
          }
        }),

        // Today's finished appointments
        prisma.appointment.count({
          where: {
            status: APPOINTMENTSTATUS.FINISHED,
            bookingTime: {
              medicalRoomTime: {
                fromTime: {
                  gte: startOfDay,
                  lt: endOfDay
                }
              }
            }
          }
        }),

        // This month's appointments
        prisma.appointment.count({
          where: {
            bookingTime: {
              medicalRoomTime: {
                fromTime: {
                  gte: startOfMonth,
                  lt: endOfMonth
                }
              }
            }
          }
        })
      ])

      // Revenue data
      const [totalRevenue, todayRevenue, monthlyRevenue] = await Promise.all([
        // Total revenue
        prisma.appointment
          .findMany({
            where: {
              status: APPOINTMENTSTATUS.PAID
            },
            select: {
              totalPrice: true
            }
          })
          .then((appointments) => appointments.reduce((sum, apt) => sum + apt.totalPrice, 0)),

        // Today's revenue
        prisma.appointment
          .findMany({
            where: {
              status: APPOINTMENTSTATUS.PAID,
              bookingTime: {
                medicalRoomTime: {
                  fromTime: {
                    gte: startOfDay,
                    lt: endOfDay
                  }
                }
              }
            },
            select: {
              totalPrice: true
            }
          })
          .then((appointments) => appointments.reduce((sum, apt) => sum + apt.totalPrice, 0)),

        // This month's revenue
        prisma.appointment
          .findMany({
            where: {
              status: APPOINTMENTSTATUS.PAID,
              bookingTime: {
                medicalRoomTime: {
                  fromTime: {
                    gte: startOfMonth,
                    lt: endOfMonth
                  }
                }
              }
            },
            select: {
              totalPrice: true
            }
          })
          .then((appointments) => appointments.reduce((sum, apt) => sum + apt.totalPrice, 0))
      ])

      // Get monthly data for the last 6 months
      const monthlyData = await this.getMonthlyAppointmentsData(6)
      const monthlyRevenueData = await this.getMonthlyRevenueData(6)

      return {
        totalPatients,
        totalStaff,
        totalDepartments,
        totalMedicalRooms,
        appointments: {
          total: totalAppointments,
          today: {
            count: todayAppointmentsCount,
            idle: todayIdleAppointments,
            booked: todayBookedAppointments,
            paid: todayPaidAppointments,
            cancel: todayCancelAppointments,
            finished: todayFinishedAppointments
          },
          monthlyData
        },
        revenue: {
          total: totalRevenue,
          today: todayRevenue,
          monthly: monthlyRevenue,
          monthlyData: monthlyRevenueData
        }
      }
    } catch (error) {
      this.handleError(error, 'Error getting admin dashboard stats')
    }
  }

  /**
   * Get doctor dashboard statistics for a specific staff member
   */
  async getDoctorDashboardStats(staffId: string): Promise<DoctorDashboardStats> {
    try {
      const now = new Date()
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const endOfDay = new Date(startOfDay)
      endOfDay.setDate(endOfDay.getDate() + 1)

      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)

      const startOfWeek = new Date(now)
      startOfWeek.setDate(now.getDate() - now.getDay())
      startOfWeek.setHours(0, 0, 0, 0)

      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(startOfWeek.getDate() + 7)

      // Get all medical rooms where this staff has shifts
      const doctorRooms = await prisma.shiftWorking.findMany({
        where: {
          staffId
        },
        select: {
          roomId: true
        },
        distinct: ['roomId']
      })

      const roomIds = doctorRooms.map((shift) => shift.roomId)

      // Get appointment statistics
      const [
        totalAppointments,
        todayAppointmentsCount,
        todayIdleAppointments,
        todayBookedAppointments,
        todayPaidAppointments,
        todayCancelAppointments,
        todayFinishedAppointments
      ] = await Promise.all([
        // Total appointments for this doctor
        prisma.appointment.count({
          where: {
            medicalRoomId: {
              in: roomIds
            }
          }
        }),

        // Today's appointments count
        prisma.appointment.count({
          where: {
            medicalRoomId: {
              in: roomIds
            },
            bookingTime: {
              medicalRoomTime: {
                fromTime: {
                  gte: startOfDay,
                  lt: endOfDay
                }
              }
            }
          }
        }),

        // Today's idle appointments
        prisma.appointment.count({
          where: {
            status: APPOINTMENTSTATUS.IDLE,
            medicalRoomId: {
              in: roomIds
            },
            bookingTime: {
              medicalRoomTime: {
                fromTime: {
                  gte: startOfDay,
                  lt: endOfDay
                }
              }
            }
          }
        }),

        // Today's booked appointments
        prisma.appointment.count({
          where: {
            status: APPOINTMENTSTATUS.BOOKED,
            medicalRoomId: {
              in: roomIds
            },
            bookingTime: {
              medicalRoomTime: {
                fromTime: {
                  gte: startOfDay,
                  lt: endOfDay
                }
              }
            }
          }
        }),

        // Today's paid appointments
        prisma.appointment.count({
          where: {
            status: APPOINTMENTSTATUS.PAID,
            medicalRoomId: {
              in: roomIds
            },
            bookingTime: {
              medicalRoomTime: {
                fromTime: {
                  gte: startOfDay,
                  lt: endOfDay
                }
              }
            }
          }
        }),

        // Today's cancelled appointments
        prisma.appointment.count({
          where: {
            status: APPOINTMENTSTATUS.CANCEL,
            medicalRoomId: {
              in: roomIds
            },
            bookingTime: {
              medicalRoomTime: {
                fromTime: {
                  gte: startOfDay,
                  lt: endOfDay
                }
              }
            }
          }
        }),

        // Today's finished appointments
        prisma.appointment.count({
          where: {
            status: APPOINTMENTSTATUS.FINISHED,
            medicalRoomId: {
              in: roomIds
            },
            bookingTime: {
              medicalRoomTime: {
                fromTime: {
                  gte: startOfDay,
                  lt: endOfDay
                }
              }
            }
          }
        })
      ])

      // Get shift statistics
      const totalShifts = await prisma.shiftWorking.count({
        where: { staffId }
      })

      // Get monthly appointment data
      const appointmentMonthlyData = await this.getDoctorMonthlyAppointmentsData(staffId, 6)

      // Get monthly shift data
      const shiftMonthlyData = await this.getDoctorMonthlyShiftsData(staffId, 6)

      // Get weekly hours data
      const weeklyHoursData = await this.getWeeklyHoursData(staffId)

      return {
        appointments: {
          total: totalAppointments,
          today: {
            count: todayAppointmentsCount,
            idle: todayIdleAppointments,
            booked: todayBookedAppointments,
            paid: todayPaidAppointments,
            cancel: todayCancelAppointments,
            finished: todayFinishedAppointments
          },
          monthlyData: appointmentMonthlyData
        },
        shifts: {
          total: totalShifts,
          monthlyData: shiftMonthlyData,
          weeklyHours: weeklyHoursData
        }
      }
    } catch (error) {
      this.handleError(error, 'Error getting doctor dashboard stats')
    }
  }

  /**
   * Get monthly statistics for admin dashboard
   */
  // async getMonthlyStats(year: number): Promise<MonthlyStats[]> {
  //   try {
  //     const monthlyData = await Promise.all(
  //       Array.from({ length: 12 }, async (_, month) => {
  //         const startOfMonth = new Date(year, month, 1)
  //         const endOfMonth = new Date(year, month + 1, 1)

  //         const [revenue, appointments, newPatients] = await Promise.all([
  //           // Monthly revenue
  //           prisma.appointment
  //             .findMany({
  //               where: {
  //                 status: APPOINTMENTSTATUS.PAID,
  //                 bookingTime: {
  //                   medicalRoomTime: {
  //                     fromTime: {
  //                       gte: startOfMonth,
  //                       lt: endOfMonth
  //                     }
  //                   }
  //                 }
  //               },
  //               include: {
  //                 medicalRoom: {
  //                   include: {
  //                     service: true
  //                   }
  //                 }
  //               }
  //             })
  //             .then((appointments) => appointments.reduce((sum, apt) => sum + (apt.medicalRoom.service.price || 0)), 0),

  //           // Monthly appointments
  //           prisma.appointment.count({
  //             where: {
  //               bookingTime: {
  //                 medicalRoomTime: {
  //                   fromTime: {
  //                     gte: startOfMonth,
  //                     lt: endOfMonth
  //                   }
  //                 }
  //               }
  //             }
  //           }),

  //           // New patients this month
  //           prisma.user.count({
  //             where: {
  //               account: {
  //                 // Assuming createdAt field exists in Account model
  //                 // You might need to adjust this based on your schema
  //               }
  //             }
  //           })
  //         ])

  //         return {
  //           month: startOfMonth.toLocaleDateString('en-US', { month: 'long' }),
  //           revenue: revenue,
  //           appointments,
  //           newPatients
  //         }
  //       })
  //     )

  //     return monthlyData
  //   } catch (error) {
  //     this.handleError(error, 'Error getting monthly stats')
  //   }
  // }

  /**
   * Get department statistics
   */
  async getDepartmentStats(): Promise<DepartmentStats[]> {
    try {
      const departments = await prisma.department.findMany({
        include: {
          medicalRooms: {
            include: {
              appointments: true,
              times: {
                include: {
                  bookings: true
                }
              }
            }
          },
          staffAssignments: true
        }
      })

      return departments.map((dept) => {
        const totalAppointments = dept.medicalRooms.reduce((sum, room) => sum + room.appointments.length, 0)

        const totalSlots = dept.medicalRooms.reduce((sum, room) => sum + room.times.length, 0)

        const bookedSlots = dept.medicalRooms.reduce(
          (sum, room) => sum + room.times.reduce((bookingSum, time) => bookingSum + time.bookings.length, 0),
          0
        )

        return {
          departmentId: dept.id,
          departmentName: dept.name,
          totalAppointments,
          totalStaff: dept.staffAssignments.length,
          occupancyRate: totalSlots > 0 ? (bookedSlots / totalSlots) * 100 : 0,
          averageWaitTime: 15 // Placeholder - implement based on your requirements
        }
      })
    } catch (error) {
      this.handleError(error, 'Error getting department stats')
    }
  }

  /**
   * Get staff performance statistics
   */
  async getStaffPerformanceStats(): Promise<StaffPerformanceStats[]> {
    try {
      const staff = await prisma.staff.findMany({
        include: {
          account: true,
          shifts: {
            include: {
              room: {
                include: {
                  appointments: true
                }
              }
            }
          }
        }
      })

      return staff.map((staffMember) => {
        const appointments = staffMember.shifts.flatMap((shift) => shift.room.appointments)
        const completedAppointments = appointments.filter((apt) => apt.status === APPOINTMENTSTATUS.PAID)

        return {
          staffId: staffMember.id,
          staffName: `${staffMember.firstname} ${staffMember.lastname}`,
          totalAppointments: appointments.length,
          completedAppointments: completedAppointments.length,
          averageConsultationTime: 30, // Placeholder
          patientSatisfactionRate: 4.5 // Placeholder
        }
      })
    } catch (error) {
      this.handleError(error, 'Error getting staff performance stats')
    }
  }

  // Helper methods
  private async calculateAverageWaitTime(): Promise<number> {
    // Placeholder implementation
    // In reality, you would calculate based on appointment times vs actual service times
    return 15 // minutes
  }

  private async calculatePatientSatisfactionRate(): Promise<number> {
    // Placeholder implementation
    // Implement based on your patient feedback system
    return 4.2 // out of 5
  }

  private async getTotalPatientsForDoctor(staffId: string): Promise<number> {
    try {
      const uniquePatients = await prisma.appointment.findMany({
        where: {
          medicalRoom: {
            shifts: {
              some: {
                staffId
              }
            }
          }
        },
        select: {
          userId: true
        },
        distinct: ['userId']
      })

      return uniquePatients.length
    } catch (error) {
      this.handleError(error, 'Error getting total patients for doctor')
    }
  }

  private async calculateAverageConsultationTime(staffId: string): Promise<number> {
    // Placeholder implementation
    // Calculate based on appointment duration vs service duration

    return 25 // minutes
  }

  private async calculateDoctorSatisfactionRate(staffId: string): Promise<number> {
    // Placeholder implementation
    // Implement based on patient feedback for this specific doctor
    return 4.3 // out of 5
  }

  private async calculateWeeklyHours(staffId: string, startOfWeek: Date, endOfWeek: Date): Promise<number> {
    try {
      const shifts = await prisma.shiftWorking.findMany({
        where: {
          staffId,
          fromTime: {
            gte: startOfWeek,
            lt: endOfWeek
          }
        }
      })

      const totalHours = shifts.reduce((sum, shift) => {
        const duration = (shift.toTime.getTime() - shift.fromTime.getTime()) / (1000 * 60 * 60)
        return sum + duration
      }, 0)

      return Math.round(totalHours * 100) / 100
    } catch (error) {
      this.handleError(error, 'Error calculating weekly hours')
    }
  }

  /**
   * Get time slot utilization statistics
   */
  async getTimeSlotUtilization(departmentId?: string): Promise<TimeSlotUtilization[]> {
    try {
      const timeSlots = await prisma.medicalRoomTime.findMany({
        where: departmentId
          ? {
              room: {
                departmentId
              }
            }
          : undefined,
        include: {
          bookings: true
        }
      })

      const utilizationMap = new Map<string, { total: number; booked: number }>()

      timeSlots.forEach((slot) => {
        const hour = slot.fromTime.getHours()
        const timeSlotKey = `${hour}:00-${hour + 1}:00`

        if (!utilizationMap.has(timeSlotKey)) {
          utilizationMap.set(timeSlotKey, { total: 0, booked: 0 })
        }

        const stats = utilizationMap.get(timeSlotKey)!
        stats.total += 1
        stats.booked += slot.bookings.length
      })

      return Array.from(utilizationMap.entries()).map(([timeSlot, stats]) => ({
        timeSlot,
        totalSlots: stats.total,
        bookedSlots: stats.booked,
        utilizationRate: stats.total > 0 ? (stats.booked / stats.total) * 100 : 0
      }))
    } catch (error) {
      this.handleError(error, 'Error getting time slot utilization')
    }
  }

  /**
   * Get appointment data for the last X months
   * @param months Number of months to get data for
   */
  private async getMonthlyAppointmentsData(months: number): Promise<
    Array<{
      month: string
      count: number
      idle: number
      booked: number
      paid: number
      cancel: number
      finished: number
    }>
  > {
    const now = new Date()
    const result = []

    for (let i = months - 1; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1)
      const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 1)

      const [count, idle, booked, paid, cancel, finished] = await Promise.all([
        // Total appointments
        prisma.appointment.count({
          where: {
            bookingTime: {
              medicalRoomTime: {
                fromTime: {
                  gte: startOfMonth,
                  lt: endOfMonth
                }
              }
            }
          }
        }),

        // Idle appointments
        prisma.appointment.count({
          where: {
            status: APPOINTMENTSTATUS.IDLE,
            bookingTime: {
              medicalRoomTime: {
                fromTime: {
                  gte: startOfMonth,
                  lt: endOfMonth
                }
              }
            }
          }
        }),

        // Booked appointments
        prisma.appointment.count({
          where: {
            status: APPOINTMENTSTATUS.BOOKED,
            bookingTime: {
              medicalRoomTime: {
                fromTime: {
                  gte: startOfMonth,
                  lt: endOfMonth
                }
              }
            }
          }
        }),

        // Paid appointments
        prisma.appointment.count({
          where: {
            status: APPOINTMENTSTATUS.PAID,
            bookingTime: {
              medicalRoomTime: {
                fromTime: {
                  gte: startOfMonth,
                  lt: endOfMonth
                }
              }
            }
          }
        }),

        // Cancelled appointments
        prisma.appointment.count({
          where: {
            status: APPOINTMENTSTATUS.CANCEL,
            bookingTime: {
              medicalRoomTime: {
                fromTime: {
                  gte: startOfMonth,
                  lt: endOfMonth
                }
              }
            }
          }
        }),

        // Finished appointments
        prisma.appointment.count({
          where: {
            status: APPOINTMENTSTATUS.FINISHED,
            bookingTime: {
              medicalRoomTime: {
                fromTime: {
                  gte: startOfMonth,
                  lt: endOfMonth
                }
              }
            }
          }
        })
      ])

      result.push({
        month: startOfMonth.toLocaleString('en-US', { month: 'long' }),
        count,
        idle,
        booked,
        paid,
        cancel,
        finished
      })
    }

    return result
  }

  /**
   * Get revenue data for the last X months
   * @param months Number of months to get data for
   */
  private async getMonthlyRevenueData(months: number): Promise<Array<{ month: string; amount: number }>> {
    const now = new Date()
    const result = []

    for (let i = months - 1; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1)
      const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 1)

      const revenue = await prisma.appointment
        .findMany({
          where: {
            status: APPOINTMENTSTATUS.PAID,
            bookingTime: {
              medicalRoomTime: {
                fromTime: {
                  gte: startOfMonth,
                  lt: endOfMonth
                }
              }
            }
          },
          select: {
            totalPrice: true
          }
        })
        .then((appointments) => appointments.reduce((sum, apt) => sum + apt.totalPrice, 0))

      result.push({
        month: startOfMonth.toLocaleString('en-US', { month: 'long' }),
        amount: revenue
      })
    }

    return result
  }

  /**
   * Get doctor's appointment data for the last X months
   * @param staffId Doctor's staff ID
   * @param months Number of months to get data for
   */
  private async getDoctorMonthlyAppointmentsData(
    staffId: string,
    months: number
  ): Promise<
    Array<{
      month: string
      count: number
      idle: number
      booked: number
      paid: number
      cancel: number
      finished: number
    }>
  > {
    const now = new Date()
    const result = []

    // Get all medical rooms where this staff has shifts
    const doctorRooms = await prisma.shiftWorking.findMany({
      where: {
        staffId
      },
      select: {
        roomId: true
      },
      distinct: ['roomId']
    })

    const roomIds = doctorRooms.map((shift) => shift.roomId)

    for (let i = months - 1; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1)
      const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 1)

      const [count, idle, booked, paid, cancel, finished] = await Promise.all([
        // Total appointments
        prisma.appointment.count({
          where: {
            medicalRoomId: {
              in: roomIds
            },
            bookingTime: {
              medicalRoomTime: {
                fromTime: {
                  gte: startOfMonth,
                  lt: endOfMonth
                }
              }
            }
          }
        }),

        // Idle appointments
        prisma.appointment.count({
          where: {
            status: APPOINTMENTSTATUS.IDLE,
            medicalRoomId: {
              in: roomIds
            },
            bookingTime: {
              medicalRoomTime: {
                fromTime: {
                  gte: startOfMonth,
                  lt: endOfMonth
                }
              }
            }
          }
        }),

        // Booked appointments
        prisma.appointment.count({
          where: {
            status: APPOINTMENTSTATUS.BOOKED,
            medicalRoomId: {
              in: roomIds
            },
            bookingTime: {
              medicalRoomTime: {
                fromTime: {
                  gte: startOfMonth,
                  lt: endOfMonth
                }
              }
            }
          }
        }),

        // Paid appointments
        prisma.appointment.count({
          where: {
            status: APPOINTMENTSTATUS.PAID,
            medicalRoomId: {
              in: roomIds
            },
            bookingTime: {
              medicalRoomTime: {
                fromTime: {
                  gte: startOfMonth,
                  lt: endOfMonth
                }
              }
            }
          }
        }),

        // Cancelled appointments
        prisma.appointment.count({
          where: {
            status: APPOINTMENTSTATUS.CANCEL,
            medicalRoomId: {
              in: roomIds
            },
            bookingTime: {
              medicalRoomTime: {
                fromTime: {
                  gte: startOfMonth,
                  lt: endOfMonth
                }
              }
            }
          }
        }),

        // Finished appointments
        prisma.appointment.count({
          where: {
            status: APPOINTMENTSTATUS.FINISHED,
            medicalRoomId: {
              in: roomIds
            },
            bookingTime: {
              medicalRoomTime: {
                fromTime: {
                  gte: startOfMonth,
                  lt: endOfMonth
                }
              }
            }
          }
        })
      ])

      result.push({
        month: startOfMonth.toLocaleString('en-US', { month: 'long' }),
        count,
        idle,
        booked,
        paid,
        cancel,
        finished
      })
    }

    return result
  }

  /**
   * Get doctor's shift data for the last X months
   * @param staffId Doctor's staff ID
   * @param months Number of months to get data for
   */
  private async getDoctorMonthlyShiftsData(
    staffId: string,
    months: number
  ): Promise<
    Array<{
      month: string
      count: number
    }>
  > {
    const now = new Date()
    const result = []

    for (let i = months - 1; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1)
      const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 1)

      const count = await prisma.shiftWorking.count({
        where: {
          staffId,
          fromTime: {
            gte: startOfMonth,
            lt: endOfMonth
          }
        }
      })

      result.push({
        month: startOfMonth.toLocaleString('en-US', { month: 'long' }),
        count
      })
    }

    return result
  }

  /**
   * Get doctor's weekly hours data
   * @param staffId Doctor's staff ID
   */
  private async getWeeklyHoursData(staffId: string): Promise<{
    week: string
    hours: number
  }> {
    const now = new Date()

    // Get current week's start and end
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay())
    startOfWeek.setHours(0, 0, 0, 0)

    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 7)

    // Calculate total hours worked this week
    const hours = await this.calculateWeeklyHours(staffId, startOfWeek, endOfWeek)

    // Format the week string as "MMM DD - MMM DD, YYYY"
    const weekEndDate = new Date(startOfWeek)
    weekEndDate.setDate(startOfWeek.getDate() + 6)

    const weekStr = `${startOfWeek.toLocaleString('en-US', { month: 'short', day: 'numeric' })} - ${weekEndDate.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`

    return {
      week: weekStr,
      hours: hours || 0
    }
  }
}
