import api, { API_BASE_URL } from "../utils/axiosConfig";

export const getRoomsForTeacher = async () => {
    const response = await api.get("/teacher/rooms");
    return response.data;
}

export const getRoomAssignments = async (id) => {
    const response = await api.get(`/teacher/assignments/${id}`);
    console.log(response.data)
    return response.data;
}

export const updateAssignment = async (id, data) => {
    const response = await api.patch(`/teacher/assignments/${id}`, data);
    console.log("mise a jour: ", response.data)
    return response.data;
}

export const deleteAssignment = async (id) => {
    const response = await api.delete(`/teacher/assignments/${id}`);
    return response.data;
}

export const createAs = async (data) => {
    const formData = new FormData();

    // Convertit l'objet plat en FormData
    formData.append("title", data.title);
    formData.append("description", data.description);
    formData.append("room_id", data.room_id);
    formData.append("due_date", data.due_date);

    // Ajoute les fichiers s'il y en a
    if (data.files) {
        data.files
            .filter((file) => file != null)
            .forEach((file) => {
                formData.append("files", file);
            });
    }

    const response = await api.post(`/teacher/assignments`, formData)
    return response.data
}


// Assignments for students:

export const createSubmission = async (data) => {
    const formData = new FormData();
    formData.append("assignment_id", data.assignmentId);

    if (data.files) {
        data.files
            .filter((file) => file != null)
            .forEach((file) => {
                formData.append("files", file);
            });
    }

    const response = await api.post(`/rooms/assignments`, formData)
    console.log(response.data)
}

export const updateSubmissionReview = async (assignmentId, submissionId, data) => {
    const response = await api.patch(`/teacher/assignments/${assignmentId}/submissions/${submissionId}`, data);
    return response.data;
}