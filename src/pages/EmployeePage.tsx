import { NavLink, Outlet } from "react-router-dom";

const EMPLOYEE_TABS = [
	{
		to: "/timesheets",
		label: "Timesheet",
		shape: "-mr-[5px] [clip-path:polygon(0_0,calc(100%-14px)_0,100%_100%,0_100%)]",
	},
	{
		to: "/materials",
		label: "Materials",
		shape: "-ml-[5px] [clip-path:polygon(0_0,100%_0,100%_100%,14px_100%)]",
	},
];

export function EmployeePage() {
	return (
		<div className="mx-auto flex w-full max-w-[480px] flex-col gap-4">
			<nav className="grid grid-cols-2" aria-label="Employee navigation">
				{EMPLOYEE_TABS.map((tab) => (
					<NavLink
						key={tab.to}
						to={tab.to}
						className={({ isActive }) =>
							`flex h-11 items-center justify-center px-5 text-sm transition-colors focus-visible:underline focus-visible:underline-offset-4 focus-visible:outline-none ${tab.shape} ${
								isActive
									? "bg-cedar-500 font-bold text-midnight-950"
									: "bg-cedar-500/30 font-medium text-midnight-950/70 hover:text-midnight-950"
							}`
						}
					>
						{tab.label}
					</NavLink>
				))}
			</nav>
			<Outlet />
		</div>
	);
}
