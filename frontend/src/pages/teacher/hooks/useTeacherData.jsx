import { QueryClient, useQuery, useQueryClient } from '@tanstack/react-query'
import React from 'react'
import { getRoomAssignments, getRoomsForTeacher } from '../../../services/TeacherApi'


export const useTeacherData = (room = null) => {

    // Recevoir les classes.
    const {
        data: rooms,
    } = useQuery({
        queryKey: ["rooms"],
        queryFn: () => getRoomsForTeacher()
    });

    //Recevoir les devoirs.
    const {
        data: assignments,
    } = useQuery({
        queryKey: ["assignments", room?.id],
        queryFn: () => getRoomAssignments(room?.id),
        enabled: !!room?.id
    });


  return {
    rooms,
    assignments
}
}
