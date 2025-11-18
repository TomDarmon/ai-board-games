"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type * as React from "react";
import { useIsMounted } from "~/hooks/is-mounted";

export function ThemeProvider({
	children,
	...props
}: React.ComponentProps<typeof NextThemesProvider>) {
	const isMounted = useIsMounted();

	if (!isMounted) {
		return <div>{children}</div>;
	}

	return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
