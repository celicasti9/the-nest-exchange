import { PropsWithChildren } from "react";

export default function PageHeading({ children }: PropsWithChildren<{}>) {
  return <h1 className="self-center pb-8 font-extrabold text-transparent text-8xl bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-600 to-blue-600">{children}</h1>
}
