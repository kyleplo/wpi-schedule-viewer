import { useRef, useState } from "preact/hooks";
import * as Types from "../shared/types"
import { Signal } from "@preact/signals";

export function UploadDialog(props: {
    show: Signal<() => void>,
    sections: Types.CourseSection[],
    setSections: (sections: Types.CourseSection[]) => void,
    setAcademicYear: (year: number) => void,
    setIsCourses: (isCourses: boolean) => void,
    loadIndex: () => void,
}){
    const [errorMsg, setErrorMsg] = useState('');

    // Sends the selected file to the server
    async function handleFileInput(event: Event) {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];        
        if (file) {
            const formData = new FormData();
            formData.append("file", file);
            const response = await fetch("/api/courses", {
                method: 'POST',
                body: formData,
            });
            const courseSections: Types.CourseSection[] | { error: string } = await response.json();
            if ("error" in courseSections) {
                setErrorMsg(courseSections.error);
            } else if (courseSections.length) {
                const terms = props.sections.map(course => course.term + course.academicYearStart);
                props.setSections(props.sections.filter(course => !terms.includes(course.term + course.academicYearStart)).concat(courseSections));
                props.setAcademicYear(courseSections[0].academicYearStart);
                props.loadIndex()
                props.setIsCourses(true);
                closeDialog();
            }      
        }
    }

    const dialogRef = useRef<HTMLDialogElement>(null);

    props.show.value = () => {
        dialogRef.current?.showModal();
        setErrorMsg("");
    }

    const closeDialog = ()=>{
        dialogRef.current?.close();
    }
    return <dialog ref={dialogRef} id='share'>
                <div class="flex">
                    <div>
                        <p>Start by exporting your courses as an Excel file on Workday. Go to your list of courses and click on the Export to Excel icon:</p>
                        <svg width="24" height="24" role="presentation" viewBox="0 0 24 24"><path d="M20.5 1A1.5 1.5 0 0 1 22 2.5v19a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 6 21.5v-2a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5V21h12V3H8v1.5a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-2A1.5 1.5 0 0 1 7.5 1z" fill="currentColor"></path><path d="M18.25 6a.75.75 0 0 1 .75.75v7a.75.75 0 0 1-.75.75H16v2.75a.75.75 0 0 1-.75.75H11.5a.5.5 0 0 1-.5-.5V17a.5.5 0 0 1 .5-.5h3v-2h-3a.5.5 0 0 1-.5-.5v-.5a.5.5 0 0 1 .5-.5h3v-2h-3a.5.5 0 0 1-.5-.5V10a.5.5 0 0 1 .5-.5h3v-2h-3A.5.5 0 0 1 11 7v-.5a.5.5 0 0 1 .5-.5zM16 13h1.5v-2H16zm0-3.5h1.5v-2H16zM3.113 6.99a.5.5 0 0 1 .423.234l1.912 3.04h.043l1.912-3.04a.5.5 0 0 1 .423-.234h1.492a.5.5 0 0 1 .412.783l-2.866 4.18L9.8 16.216a.5.5 0 0 1-.413.783H7.91a.5.5 0 0 1-.422-.23l-1.997-3.13h-.043l-1.983 3.128a.5.5 0 0 1-.422.232H1.55a.5.5 0 0 1-.414-.782l2.925-4.266-2.855-4.18a.5.5 0 0 1 .413-.782z" fill="currentColor"></path></svg>
                        <p>Then upload the Excel file here:</p>
                        <label class="file-input">
                            <input type="file" id="xlsxInput" accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={handleFileInput}/>
                            Upload Schedule
                        </label>
                        {errorMsg && <p class='error'> {errorMsg}</p>}
                    </div>
                    <button class="close-button" onClick={closeDialog}>X</button>
                </div>
            </dialog>
}