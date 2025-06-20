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
      const [
        totalPatients,
        totalStaff,
        totalAppointments,
        todayAppointments,
        totalDepartments,
        totalMedicalRooms,
        monthlyRevenue,
        appointmentStatusCounts,
        avgWaitTime,
        satisfactionRate
      ] = await Promise.all([
        // Total unique patients
        prisma.user.count(),

        // Total staff members
        prisma.staff.count(),

        // Total appointments
        prisma.appointment.count(),

        // Today's appointments
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

        // Total departments
        prisma.department.count(),

        // Total medical rooms
        prisma.medicalRoom.count(),

        // Monthly revenue (accessing price through medicalRoom.service)
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
            include: {
              medicalRoom: {
                include: {
                  service: true
                }
              }
            }
          })
          .then((appointments) => appointments.reduce((sum, apt) => sum + (apt.medicalRoom.service.price || 0), 0)),

        // Appointment status counts
        prisma.appointment.groupBy({
          by: ['status'],
          _count: {
            status: true
          }
        }),

        // Average wait time calculation (simplified)
        this.calculateAverageWaitTime(),

        // Patient satisfaction rate (placeholder - implement based on your feedback system)
        this.calculatePatientSatisfactionRate()
      ])

      // Process appointment status counts
      const statusCounts = appointmentStatusCounts.reduce(
        (acc, item) => {
          acc[item.status] = item._count.status
          return acc
        },
        {} as Record<APPOINTMENTSTATUS, number>
      )

      return {
        totalPatients,
        totalStaff,
        totalAppointments,
        todayAppointments,
        totalDepartments,
        totalMedicalRooms,
        monthlyRevenue: monthlyRevenue,
        completedAppointments: statusCounts[APPOINTMENTSTATUS.PAID] || 0,
        pendingAppointments: statusCounts[APPOINTMENTSTATUS.BOOKED] || 0,
        cancelledAppointments: statusCounts[APPOINTMENTSTATUS.CANCEL] || 0,
        averageWaitTime: avgWaitTime,
        patientSatisfactionRate: satisfactionRate
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

      const startOfWeek = new Date(now)
      startOfWeek.setDate(now.getDate() - now.getDay())
      startOfWeek.setHours(0, 0, 0, 0)

      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(startOfWeek.getDate() + 7)

      // Get doctor's shifts for appointment filtering
      const doctorShifts = await prisma.shiftWorking.findMany({
        where: {
          staffId,
          fromTime: {
            gte: startOfDay,
            lt: endOfDay
          }
        },
        select: {
          roomId: true
        }
      })

      const roomIds = doctorShifts.map((shift) => shift.roomId)

      const [
        todayAppointments,
        upcomingAppointments,
        completedToday,
        totalPatients,
        avgConsultationTime,
        currentShifts,
        weeklyHours
      ] = await Promise.all([
        // Today's appointments for this doctor
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

        // Upcoming appointments (future appointments)
        prisma.appointment.count({
          where: {
            medicalRoomId: {
              in: roomIds
            },
            bookingTime: {
              medicalRoomTime: {
                fromTime: {
                  gt: now
                }
              }
            },
            status: {
              in: [APPOINTMENTSTATUS.BOOKED, APPOINTMENTSTATUS.PAID]
            }
          }
        }),

        // Completed appointments today
        prisma.appointment.count({
          where: {
            medicalRoomId: {
              in: roomIds
            },
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

        // Total unique patients treated by this doctor
        this.getTotalPatientsForDoctor(staffId),

        // Average consultation time
        this.calculateAverageConsultationTime(staffId),

        // Current shifts today
        prisma.shiftWorking.count({
          where: {
            staffId,
            fromTime: {
              gte: startOfDay,
              lt: endOfDay
            }
          }
        }),

        // Weekly hours
        this.calculateWeeklyHours(staffId, startOfWeek, endOfWeek)
      ])

      return {
        todayAppointments,
        upcomingAppointments,
        completedToday,
        totalPatients,
        averageConsultationTime: avgConsultationTime,
        currentShifts,
        weeklyHours
      }
    } catch (error) {
      this.handleError(error, 'Error getting doctor dashboard stats')
    }
  }

  /**
   * Get monthly statistics for admin dashboard
   */
  async getMonthlyStats(year: number): Promise<MonthlyStats[]> {
    try {
      const monthlyData = await Promise.all(
        Array.from({ length: 12 }, async (_, month) => {
          const startOfMonth = new Date(year, month, 1)
          const endOfMonth = new Date(year, month + 1, 1)

          const [revenue, appointments, newPatients] = await Promise.all([
            // Monthly revenue
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
                include: {
                  medicalRoom: {
                    include: {
                      service: true
                    }
                  }
                }
              })
              .then((appointments) => appointments.reduce((sum, apt) => sum + (apt.medicalRoom.service.price || 0), 0)),

            // Monthly appointments
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

            // New patients this month
            prisma.user.count({
              where: {
                account: {
                  // Assuming createdAt field exists in Account model
                  // You might need to adjust this based on your schema
                }
              }
            })
          ])

          return {
            month: startOfMonth.toLocaleDateString('en-US', { month: 'long' }),
            revenue: revenue,
            appointments,
            newPatients
          }
        })
      )

      return monthlyData
    } catch (error) {
      this.handleError(error, 'Error getting monthly stats')
    }
  }

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
}
