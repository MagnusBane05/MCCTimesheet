import { EmployeeCreationResult } from "../../domain/user";
import { Button } from "../common/Button";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

export interface EmployeeCreationSuccessProps {
    result: EmployeeCreationResult;
    onDone: () => void;
}

export function EmployeeCreationSuccess({ result, onDone }: EmployeeCreationSuccessProps) {
    return (
        <div className="flex flex-col gap-4">
            <div className="p-4 bg-success-50 border border-success-200 rounded-lg">
                <p className="text-success-700 font-semibold mb-3">Employee Created Successfully</p>

                <div className="space-y-3 text-sm">
                    <div>
                        <p className="text-navy-900/60">Username:</p>
                        <p className="font-mono text-navy-950 bg-white px-2 py-1 rounded border border-navy-800/10">
                            {result.username}
                        </p>
                    </div>

                    <div>
                        <p className="text-navy-900/60">Display Name:</p>
                        <p className="font-mono text-navy-950 bg-white px-2 py-1 rounded border border-navy-800/10">
                            {result.displayName}
                        </p>
                    </div>

                    <div>
                        <p className="text-navy-900/60">Role:</p>
                        <p className="font-mono text-navy-950 bg-white px-2 py-1 rounded border border-navy-800/10">
                            {result.role}
                        </p>
                    </div>

                    <div className="pt-2 border-t border-success-200">
                        <p className="text-navy-900/60 font-semibold">Temporary Password:</p>
                        <p className="font-mono text-lg text-navy-950 bg-warning-50 px-2 py-2 rounded border border-warning-200 mt-1">
                            {result.temporaryPassword}
                        </p>
                    </div>

                    <div className="pt-3 bg-warning-50 p-3 rounded border border-warning-200 text-xs flex flex-row gap-2">
                        <ExclamationTriangleIcon className="h-7 w-7 text-warning-600" aria-hidden="true" />
                        <p className="text-navy-950">
                            <strong>This password will only be shown once.</strong> The employee will be required to change it after signing in.
                        </p>
                    </div>
                </div>
            </div>

            <Button onClick={onDone} variant="primary" className="w-full">
                I have saved the temporary password
            </Button>
        </div>
    );
}
