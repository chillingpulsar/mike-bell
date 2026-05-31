export type BuiltinSoundIds =
	| 'off'
	| 'classic'
	| 'soft'
	| 'bubble'
	| 'vault'
	| 'dew'
	| 'ink'
	| 'spark'
	| 'velvet'
	| 'wool'
	| 'cocoa'
	| 'plush'
	| 'thock'
	| 'cream'
	| 'flannel'
	| 'ember'
	| 'honey'
	| 'cashmere'
	| 'moss';

/** SoundIds can be a builtin id or a custom sound id (prefixed with "custom:"). */
export type SoundIds = BuiltinSoundIds | `custom:${string}`;
