import { useQuery } from "@tanstack/react-query";
import { useAuth }  from "../../../contexts/AuthContext";
import { getUserRoom, getPosts, getRoomMedia, getCourseSession } from "../../../services/api";
import { useEffect, useState } from "react";


export const useAttendanceData = () => {
    const { user: authUser } = useAuth();
    const [activeCourseSession, setActiveCourseSession] = useState(null)

    useEffect(() => {
        checkForCourseSession();
    }, [])

    const checkForCourseSession = async () =>{
        const response = await getCourseSession()
        setActiveCourseSession(response)
    }
    

    return {
        activeCourseSession,
        setActiveCourseSession,
        checkForCourseSession,
    };
};