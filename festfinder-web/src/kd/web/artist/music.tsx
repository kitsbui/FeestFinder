'use client';
/**
 * The playlist in a chunk of its own (`next/dynamic` must be called from a client file to split):
 * an artist page without tracks never downloads it, one with tracks gets it rendered on the server
 * and hydrated when its chunk arrives.
 */
import dynamic from 'next/dynamic';

export const LazyPlaylist = dynamic(() => import('./playlist').then((m) => m.Playlist));
