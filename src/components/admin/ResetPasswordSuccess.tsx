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
            <div className="p-4 bg-mahogany-900/10 border border-mahogany-900/40 rounded-lg">
                <p className="text-mahogany-900 font-semibold mb-3">Password Reset Successfully</p>

                <div className="space-y-3 text-sm">
                    <div>
                        <p className="text-lakehouse-900/60">Employee:</p>
                        <p className="font-mono text-midnight-950 bg-white px-2 py-1 rounded border border-lake-800/20">
                            {username}
                        </p>
                    </div>

                    <div className="pt-2 border-t border-mahogany-900/40">
                        <p className="text-lakehouse-900/60 font-semibold">New Temporary Password:</p>
                        <p className="font-mono text-lg text-midnight-950 bg-birch-50 px-2 py-2 rounded border border-mahogany-900/40 mt-1">
                            {temporaryPassword}
                        </p>
                    </div>

                    <div className="pt-3 bg-birch-50 p-3 rounded border border-mahogany-900/40 text-xs flex flex-row gap-2">
                        <ExclamationTriangleIcon className="h-7 w-7 text-mahogany-900" aria-hidden="true" />
                        <p className="text-midnight-950">
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
