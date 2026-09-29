import { EmployeeCreationResult } from "../../domain/user";
import { Button } from "../common/Button";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { CheckCircleIcon } from "@heroicons/react/24/outline";
import { CopyButton } from "../common/CopyButton";

export interface EmployeeCreationSuccessProps {
    result: EmployeeCreationResult;
    onDone: () => void;
}

export function EmployeeCreationSuccess({ result, onDone }: EmployeeCreationSuccessProps) {
    return (
        <div className="flex flex-col gap-4">
            <div className="p-4">
                <div className="flex items-center gap-2 border border-success-200 bg-success-50 p-3 rounded-lg mb-3">
                    <CheckCircleIcon className="w-6 h-6 text-success-800"/>
                    <p className="text-success-800 font-semibold">Employee Created Successfully</p>
                </div>

                <div className="space-y-3 text-sm">
                    <div>
                        <p className="text-lakehouse-900/60">Username:</p>
                        <p className="font-mono">
                            {result.username}
                        </p>
                    </div>

                    <div>
                        <p className="text-lakehouse-900/60">Display Name:</p>
                        <p className="font-mono">
                            {result.displayName}
                        </p>
                    </div>

                    <div>
                        <p className="text-lakehouse-900/60">Role:</p>
                        <p className="font-mono">
                            {result.role}
                        </p>
                    </div>

                    <div className="pt-2 border-t border-lake-800/20">
                        <p className="text-lakehouse-900/60 font-semibold">Temporary Password:</p>
                        <div className="flex justify-between items-center px-2 rounded border border-lake-800/20">
                        <p className="font-mono text-lg py-2">
                            {result.temporaryPassword}
                        </p>
                        <CopyButton text={result.temporaryPassword} />
                    </div>
                    </div>

                    <div className="flex flex-row items-center pt-3 p-3 rounded border border-warning-800 bg-warning-50 text-warning-800 gap-2">
                        <ExclamationTriangleIcon className="h-7 w-7" aria-hidden="true" />
                        <p className="text-sm">
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
