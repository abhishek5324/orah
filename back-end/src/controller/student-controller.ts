import { getRepository } from "typeorm"
import { NextFunction, Request, Response } from "express"
import { Student } from "../entity/student.entity"
import { CreateStudentInput, UpdateStudentInput } from "../interface/student.interface"
import { CreateResponse } from "../interface/responseHandler.interface"
export class StudentController {
  private studentRepository = getRepository(Student)
  private responseHandler(data: CreateResponse) {
    const response: CreateResponse = {
      data: data.data || {},
      statusCode: data.statusCode || 200,
      userMessage: data.userMessage || "",
    }
    return response
  }

  async getStudent(request: Request, response: Response, next: NextFunction) {
    try {
      const student = await this.studentRepository.find({ id: request.params.id })
      return this.responseHandler({ data: student, statusCode: 200, userMessage: "" })
    } catch (error) {
      return this.responseHandler({ data: error, statusCode: 500, userMessage: "error" })
    }
  }

  async allStudents(request: Request, response: Response, next: NextFunction) {
    try {
      const student = await this.studentRepository.find()
      return this.responseHandler({ data: student, statusCode: 200, userMessage: "" })
    } catch (error) {
      return this.responseHandler({ data: error, statusCode: 500, userMessage: "error" })
    }
  }

  async createStudent(request: Request, response: Response, next: NextFunction) {
    try {
      const { body: params } = request

      const createStudentInput: CreateStudentInput = {
        first_name: params.first_name,
        last_name: params.last_name,
        photo_url: params.photo_url,
      }
      const student = new Student()
      student.prepareToCreate(createStudentInput)

      const newStudent = await this.studentRepository.save(student)
      return this.responseHandler({ data: newStudent, statusCode: 200, userMessage: "" })
    } catch (error) {
      return this.responseHandler({ data: error, statusCode: 500, userMessage: "error" })
    }
  }

  async updateStudent(request: Request, response: Response, next: NextFunction) {
    try {
      const { body: params } = request

      const student = await this.studentRepository.findOne(params.id)

      const updateStudentInput: UpdateStudentInput = {
        id: params.id,
        first_name: params.first_name,
        last_name: params.last_name,
        photo_url: params.photo_url,
      }

      student.prepareToUpdate(updateStudentInput)
      const updatedStudent = await this.studentRepository.save(student)
      return this.responseHandler({ data: updatedStudent, statusCode: 200, userMessage: "" })
    } catch (error) {
      return this.responseHandler({ data: error, statusCode: 500, userMessage: "error" })
    }
  }

  async removeStudent(request: Request, response: Response, next: NextFunction) {
    try {
      const studentToRemove = await this.studentRepository.findOne(request.params.id)
      await this.studentRepository.remove(studentToRemove)
      return this.responseHandler({ data: studentToRemove, statusCode: 200, userMessage: "" })
    } catch (error) {
      return this.responseHandler({ data: error, statusCode: 500, userMessage: "error" })
    }
  }
}
