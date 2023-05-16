import { getRepository } from "typeorm"
import { NextFunction, Request, Response } from "express"
import { Roll } from "../entity/roll.entity"
import { StudentRollState } from "../entity/student-roll-state.entity"
import { CreateRollInput, UpdateRollInput } from "../interface/roll.interface"
import { CreateStudentRollStateInput, UpdateStudentRollStateInput } from "../interface/student-roll-state.interface"
import { CreateResponse } from "../interface/responseHandler.interface"
import { map } from "lodash"

export class RollController {
  private rollRepository = getRepository(Roll)
  private studentRollStateRepository = getRepository(StudentRollState)
  private responseHandler(data: CreateResponse) {
    const response: CreateResponse = {
      data: data.data || {},
      statusCode: data.statusCode || 200,
      userMessage: data.userMessage || "",
    }
    return response
  }

  async allRolls(request: Request, response: Response, next: NextFunction) {
    try {
      const rolls = await this.rollRepository.find()
      return this.responseHandler({ data: rolls, statusCode: 200, userMessage: "" })
    } catch (error) {
      return this.responseHandler({ data: error, statusCode: 500, userMessage: "error" })
    }
  }

  async createRoll(request: Request, response: Response, next: NextFunction) {
    try {
      const { body: params } = request

      const createRollInput: CreateRollInput = {
        name: params.name,
        completed_at: params.completed_at,
      }
      const roll = new Roll()
      roll.prepareToCreate(createRollInput)
      const newRoll = await this.rollRepository.save(roll)
      return this.responseHandler({ data: newRoll, statusCode: 200, userMessage: "" })
    } catch (error) {
      return this.responseHandler({ data: error, statusCode: 500, userMessage: "error" })
    }
  }

  async updateRoll(request: Request, response: Response, next: NextFunction) {
    try {
      const { body: params } = request

      const roll = await this.rollRepository.findOne(params.id)
      const updateRollInput: UpdateRollInput = {
        id: params.id,
        name: params.name,
        completed_at: params.completed_at,
      }
      roll.prepareToUpdate(updateRollInput)
      const updatedRoll = await this.rollRepository.save(roll)
      return this.responseHandler({ data: updatedRoll, statusCode: 200, userMessage: "" })
    } catch (error) {
      return this.responseHandler({ data: error, statusCode: 500, userMessage: "error" })
    }
  }

  async removeRoll(request: Request, response: Response, next: NextFunction) {
    try {
      const rollToRemove = await this.rollRepository.findOne(request.params.id)
      await this.rollRepository.remove(rollToRemove)
      return this.responseHandler({ data: rollToRemove, statusCode: 200, userMessage: "" })
    } catch (error) {
      return this.responseHandler({ data: error, statusCode: 500, userMessage: "error" })
    }
  }

  async getRoll(request: Request, response: Response, next: NextFunction) {
    try {
      const roll = await this.studentRollStateRepository.find({ roll_id: request.params.id })
      return this.responseHandler({ data: roll, statusCode: 200, userMessage: "" })
    } catch (error) {
      return this.responseHandler({ data: error, statusCode: 500, userMessage: "error" })
    }
  }

  async addStudentRollStates(request: Request, response: Response, next: NextFunction) {
    try {
      const { body: params } = request
      const studentRollStates: StudentRollState[] = map(params, (param) => {
        const createStudentRollStateInput: CreateStudentRollStateInput = {
          roll_id: param.roll_id,
          student_id: param.student_id,
          state: param.state,
        }

        const studentRollState = new StudentRollState()
        studentRollState.prepareToCreate(createStudentRollStateInput)
        return studentRollState
      })

      const studentStates = await this.studentRollStateRepository.save(studentRollStates)
      return this.responseHandler({ data: studentStates, statusCode: 200, userMessage: "" })
    } catch (error) {
      return this.responseHandler({ data: error, statusCode: 500, userMessage: "error" })
    }
  }

  async addStudentRollState(request: Request, response: Response, next: NextFunction) {
    try {
      const { body: params } = request

      const createStudentRollStateInput: CreateStudentRollStateInput = {
        roll_id: params.roll_id,
        student_id: params.student_id,
        state: params.state,
      }
      const studentRollState = new StudentRollState()
      studentRollState.prepareToCreate(createStudentRollStateInput)
      const studentState = await this.studentRollStateRepository.save(studentRollState)
      return this.responseHandler({ data: studentState, statusCode: 200, userMessage: "" })
    } catch (error) {
      return this.responseHandler({ data: error, statusCode: 500, userMessage: "error" })
    }
  }

  async updateStudentRollState(request: Request, response: Response, next: NextFunction) {
    try {
      const { body: params } = request

      const currentStudentState = await this.studentRollStateRepository.findOne(params.id)
      const updateStudentRollStateInput: UpdateStudentRollStateInput = {
        id: params.id,
        roll_id: params.roll_id,
        student_id: params.student_id,
        state: params.state,
      }
      currentStudentState.prepareToUpdate(updateStudentRollStateInput)
      const updatedStudentState = await this.studentRollStateRepository.save(currentStudentState)
      return this.responseHandler({ data: updatedStudentState, statusCode: 200, userMessage: "" })
    } catch (error) {
      return this.responseHandler({ data: error, statusCode: 500, userMessage: "error" })
    }
  }
}
