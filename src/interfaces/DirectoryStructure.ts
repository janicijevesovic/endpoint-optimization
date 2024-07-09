export interface SubDirectory {
	[subDirectoryName: string]: string[];
}

export interface Directory {
	[directoryName: string]: (string | SubDirectory)[];
}

export interface IPDirectoryStructure {
	[ipAddress: string]: Directory[];
}
