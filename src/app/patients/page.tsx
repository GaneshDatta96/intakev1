"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PlusCircle, LoaderCircle, AlertCircle, Copy, CheckCircle } from "lucide-react";

const patientSchema = z.object({
    first_name: z.string().min(1, "First name is required"),
    last_name: z.string().min(1, "Last name is required"),
    email: z.string().email("Invalid email address"),
});

type Patient = {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    created_at: string;
};

export default function PatientsPage() {
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const [patients, setPatients] = useState<Patient[]>([]);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const { register, handleSubmit, reset, formState: { errors } } = useForm<z.infer<typeof patientSchema>>({
        resolver: zodResolver(patientSchema),
    });

    const onSubmit = (values: z.infer<typeof patientSchema>) => {
        startTransition(async () => {
            setError(null);
            try {
                const response = await fetch("/api/patients/create", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(values),
                });

                if (!response.ok) {
                    throw new Error("Failed to create patient");
                }

                const newPatient = await response.json();
                setPatients([newPatient, ...patients]);
                reset();
            } catch (err) {
                setError(err instanceof Error ? err.message : "An unknown error occurred");
            }
        });
    };

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 2000);
        });
    };

    return (
        <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-5 py-8 sm:px-8 lg:px-12">
            <div className="space-y-4">
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Patients</h1>
                <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:items-end">
                    <div className="grid gap-1.5">
                        <label className="font-medium">First Name</label>
                        <input {...register("first_name")} className="rounded-lg border bg-white px-3 py-2 text-base outline-none focus:ring-2 focus:ring-blue-500" />
                        {errors.first_name && <p className="text-sm text-red-500">{errors.first_name.message}</p>}
                    </div>
                    <div className="grid gap-1.5">
                        <label className="font-medium">Last Name</label>
                        <input {...register("last_name")} className="rounded-lg border bg-white px-3 py-2 text-base outline-none focus:ring-2 focus:ring-blue-500" />
                        {errors.last_name && <p className="text-sm text-red-500">{errors.last_name.message}</p>}
                    </div>
                    <div className="grid gap-1.5">
                        <label className="font-medium">Email</label>
                        <input {...register("email")} className="rounded-lg border bg-white px-3 py-2 text-base outline-none focus:ring-2 focus:ring-blue-500" />
                        {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
                    </div>
                    <button type="submit" disabled={isPending} className="sm:col-span-3 inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-md transition-transform hover:scale-105 disabled:opacity-50">
                        {isPending ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <PlusCircle className="h-5 w-5" />}
                        Create New Patient
                    </button>
                </form>
                {error && <div className="flex items-center gap-2 rounded-lg bg-red-50 p-4 text-red-700"><AlertCircle className="h-5 w-5" />{error}</div>}
            </div>

            <div className="space-y-4">
                <h2 className="text-2xl font-bold tracking-tight">Patient List</h2>
                {patients.length > 0 ? (
                    <div className="space-y-3">
                        {patients.map((patient) => {
                            const intakeLink = `${window.location.origin}/questionnaire/${patient.id}`;
                            return (
                                <div key={patient.id} className="flex items-center justify-between gap-4 rounded-xl border bg-white p-4 shadow-sm">
                                    <div>
                                        <p className="font-semibold">{patient.first_name} {patient.last_name}</p>
                                        <p className="text-sm text-gray-500">{patient.email}</p>
                                        <p className="mt-1 font-mono text-xs text-gray-400">Created: {new Date(patient.created_at).toLocaleDateString()}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input type="text" readOnly value={intakeLink} className="w-72 rounded-md border bg-gray-50 px-2 py-1 text-sm text-gray-600" />
                                        <button onClick={() => copyToClipboard(intakeLink, patient.id)} className="rounded-full p-2.5 bg-gray-100 hover:bg-gray-200 transition-colors">
                                            {copiedId === patient.id ? <CheckCircle className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5 text-gray-500" />}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="rounded-[2rem] border-2 border-dashed border-gray-200 p-12 text-center">
                        <p className="text-lg font-medium text-gray-500">No patients have been created yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
