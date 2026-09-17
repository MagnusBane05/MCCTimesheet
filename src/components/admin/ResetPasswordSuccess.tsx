import { Button } from "../common/Button";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

export interface ResetPasswordSuccessProps {
    username: string;
    temporaryPassword: string;
    onDone: () => void;
}

export function ResetPasswordSuccess({ username, temporaryPassword, onDone }: ResetPasswordSuccessProps) {
    return (
        <div className="flex flex-col gap-4">
            <div className="p-4 bg-info-50 border border-info-200 rounded-lg">
                <p className="text-info-700 font-semibold mb-3">Password Reset Successfully</p>

                <div className="space-y-3 text-sm">
                    <div>
                        <p className="text-navy-900/60">Employee:</p>
                        <p className="font-mono text-navy-950 bg-white px-2 py-1 rounded border border-navy-800/10">
                            {username}
                        </p>
                    </div>

                    <div className="pt-2 border-t border-info-200">
                        <p className="text-navy-900/60 font-semibold">New Temporary Password:</p>
                        <p className="font-mono text-lg text-navy-950 bg-warning-50 px-2 py-2 rounded border border-warning-200 mt-1">
                            {temporaryPassword}
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
