import { getRepository } from "typeorm"
import { NextFunction, Request, Response } from "express"
import { Group } from "../entity/group.entity"
import { GroupStudent } from "../entity/group-student.entity"
import { Roll } from "../entity/roll.entity"
import { StudentRollState } from "../entity/student-roll-state.entity"
import { Student } from "../entity/student.entity"
import { CreateGroupInput, UpdateGroupInput } from "../interface/group.interface"
import { CreateStudentGroupInput } from "../interface/group-student.inferface"
import { CreateResponse } from "../interface/responseHandler.interface" 
import { map } from "lodash"

export class GroupController {
  private groupRepository = getRepository(Group)
  private groupStudentRepository = getRepository(GroupStudent)
  private rollRepository = getRepository(Roll)
  private studentRollState = getRepository(StudentRollState)
  private studentRepository = getRepository(Student)

  private responseHandler(data: CreateResponse) {
    const response: CreateResponse = {
      data: data.data || {},
      statusCode: data.statusCode || 200,
      userMessage: data.userMessage || "",
    }
    return response
  }

  async allGroups(request: Request, response: Response, next: NextFunction) {
    // Task 1:
    // Return the list of all groups

    try {
      const groups = await this.groupRepository.find()
      return this.responseHandler({ data: groups, statusCode: 200, userMessage: "" })
    } catch (error) {
      return this.responseHandler({ data: error, statusCode: 500, userMessage: "error" })
    }
  }

  async createGroup(request: Request, response: Response, next: NextFunction) {
    // Task 1:
    // Add a Group

    try {
      const { body: params } = request
      const createGroupInput: CreateGroupInput = {
        name: params.name,
        number_of_weeks: params.number_of_weeks,
        roll_states: params.roll_states,
        incidents: params.incidents,
        ltmt: params.ltmt,
      }

      const group = new Group()
      group.prepareToCreate(createGroupInput)
      const newGroup = await this.groupRepository.save(group)
      return this.responseHandler({ data: newGroup, statusCode: 200, userMessage: "" })
    } catch (error) {
      return this.responseHandler({ data: error, statusCode: 500, userMessage: "error" })
    }
  }

  async updateGroup(request: Request, response: Response, next: NextFunction) {
    try {
      const { body: params } = request
      const group = await this.groupRepository.findOne(params.id)

      if (!group) {
        return this.responseHandler({ data: {}, statusCode: 500, userMessage: "Group not found" })
      }

      const updateGroupInput: UpdateGroupInput = {
        id: params.id,
        name: params.name,
        number_of_weeks: params.number_of_weeks,
        roll_states: params.roll_states,
        incidents: params.incidents,
        ltmt: params.ltmt,
        run_at: params.run_at,
        student_count: params.student_count,
      }

      group.prepareToUpdate(updateGroupInput)
      const updatedGroup = await this.groupRepository.save(group)
      return this.responseHandler({ data: updatedGroup, statusCode: 200, userMessage: "" })
    } catch (error) {
      return this.responseHandler({ data: error, statusCode: 500, userMessage: "error" })
    }
  }

  async removeGroup(request: Request, response: Response, next: NextFunction) {
    // Task 1:
    // Delete a Group
    try {
      const groupToRemove = await this.groupRepository.findOne(request.params.id)
      await this.groupRepository.remove(groupToRemove)
      return this.responseHandler({ data: { groupToRemove }, statusCode: 200, userMessage: "group deleted" })
    } catch (error) {
      return this.responseHandler({ data: error, statusCode: 500, userMessage: "error" })
    }
  }

  async getGroupStudents(request: Request, response: Response, next: NextFunction) {
    // Task 1:
    // Return the list of Students that are in a Group
    try {
      const { query: params } = request
      const group_id: number = params.group_id
      const groupStudents = await this.groupStudentRepository.createQueryBuilder("student").select("student.student_id AS id").where(`student.group_id = ${group_id}`).getRawMany()

      const studentIds = groupStudents.map((student) => student.id)

      const students = await this.studentRepository
        .createQueryBuilder("student")
        .select("student.first_name AS first_name, student.last_name AS last_name, student.first_name || ' ' || student.last_name AS full_name")
        .where("id IN (:...studentIds)", { studentIds })
        .getRawMany()
      return this.responseHandler({ data: students, statusCode: 200, userMessage: "" })
    } catch (error) {
      return this.responseHandler({ data: error, statusCode: 500, userMessage: "error" })
    }
  }

  async runGroupFilters(request: Request, response: Response, next: NextFunction) {
    try {
      // Task 2:
      // 1. Clear out the groups (delete all the students from the groups)
      await this.groupStudentRepository.clear()

      // 2. For each group, query the student rolls to see which students match the filter for the group
      const groups = await this.groupRepository.find()

      for (let group of groups) {
        let { id, number_of_weeks, roll_states, incidents, ltmt } = group
        let states = roll_states.split(",")
        let days = number_of_weeks * 7
        let endDate = new Date()
        let startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000) // subtract 14 days from today

        const getRollsInTimeFrame = await this.rollRepository
          .createQueryBuilder("roll")
          .select("roll.id as id")
          .where(`roll.completed_at BETWEEN '${startDate.toISOString()}' AND '${endDate.toISOString()}'`)
          .getRawMany()

        let rollIds = getRollsInTimeFrame.map((roll) => roll.id)
        const filteredStudents = await this.studentRollState
          .createQueryBuilder("studentRoll")
          .select("studentRoll.student_id, COUNT(*)", "incident_count")
          .addSelect(`${id}`, "group_id")
          .where(`studentRoll.roll_id IN (${rollIds})`)
          .andWhere("studentRoll.state IN (:...states)", { states })
          .groupBy("studentRoll.student_id")
          .having(`COUNT(*) ${ltmt} ${incidents}`)
          .getRawMany()

        // 3. Add the list of students that match the filter to the group

        const groupStudents: GroupStudent[] = map(filteredStudents, (student: GroupStudent) => {
          const createStudentGroupInput: CreateStudentGroupInput = {
            student_id: student.student_id,
            group_id: student.group_id,
            incident_count: student.incident_count,
          }

          const groupStudent = new GroupStudent()
          groupStudent.prepareToCreate(createStudentGroupInput)
          return groupStudent
        })

        await this.groupStudentRepository.save(groupStudents)
        const groupData = await this.groupRepository.findOne(group.id)

        const updateGroupInput: UpdateGroupInput = {
          id: groupData.id,
          name: groupData.name,
          number_of_weeks: groupData.number_of_weeks,
          roll_states: groupData.roll_states,
          incidents: groupData.incidents,
          ltmt: groupData.ltmt,
          run_at: new Date(),
          student_count: filteredStudents.length,
        }
        groupData.prepareToUpdate(updateGroupInput)
        await this.groupRepository.save(groupData)
      }
      return this.responseHandler({ data: {}, statusCode: 200, userMessage: "filter query executed succesfully" })
    } catch (error) {
      return this.responseHandler({ data: error, statusCode: 500, userMessage: "error" })
    }
  }
}
