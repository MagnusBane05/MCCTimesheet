import { NavLink, Outlet } from "react-router-dom";

const EMPLOYEE_TABS = [
	{ to: "/timesheets", label: "Timesheet" },
	{ to: "/materials", label: "Materials" },
];

export function EmployeePage() {
	return (
		<div className="flex flex-col gap-4">
			<nav className="grid grid-cols-2 gap-1 rounded-lg bg-midnight-950/5 p-1" aria-label="Employee navigation">
				{EMPLOYEE_TABS.map((tab) => (
					<NavLink
						key={tab.to}
						to={tab.to}
						className={({ isActive }) =>
							`rounded-md px-3 py-2 text-center text-sm font-medium transition-colors ${
								isActive
									? "bg-white text-midnight-950 shadow-sm"
									: "text-midnight-950/60 hover:text-midnight-950"
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
