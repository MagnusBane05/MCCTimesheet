import { Button } from "../common/Button";
import { CheckCircleIcon, ExclamationTriangleIcon, ClipboardDocumentListIcon } from "@heroicons/react/24/outline";
import { CopyButton } from "../common/CopyButton";

export interface ResetPasswordSuccessProps {
    username: string;
    temporaryPassword: string;
    onDone: () => void;
}

export function ResetPasswordSuccess({ username, temporaryPassword, onDone }: ResetPasswordSuccessProps) {
    return (
        <div className="flex flex-col gap-4">
            <div className="p-2 rounded-lg">
                <div className="flex items-center gap-2 border border-success-200 bg-success-50 p-3 rounded-lg mb-3">
                    <CheckCircleIcon className="w-6 h-6 text-success-800"/>
                    <p className="text-success-800 font-semibold">Password reset</p>
                </div>

                <div className="space-y-2 text-sm">
                    <div>
                        <p className="text-lakehouse-900/60">Employee:</p>
                        <p className="font-mono rounded">
                            {username}
                        </p>
                    </div>

                    <div className="space-y-1 pt-2 border-t border-lake-800/20">
                        <p className="text-lakehouse-900/60">New Temporary Password:</p>
                        <div className="flex justify-between items-center px-2 rounded border border-lake-800/20">
                            <p className="font-mono text-lg py-2">
                                {temporaryPassword}
                            </p>
                            <CopyButton text={temporaryPassword} />
                        </div>
                    </div>

                    <div className="flex flex-row items-center p-3 rounded border border-warning-200 bg-warning-50 text-warning-800 white gap-2">
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
