import http, { getPaginationSet, PaginatedResult } from '@/api/http';

export interface Mod {
    category: string;
    id: number | string;
    name: string;
    description: string;
    icon: string;
    downloads: number;
    modUrl: string;
    installable: boolean;
}

export const rawDataToMod = (data: any): Mod => {
    return {
        category: data.category,
        id: data.id,
        name: data.name,
        description: data.description,
        icon: data.icon,
        downloads: data.downloads,
        modUrl: data.modUrl,
        installable: data.installable,
    };
};

export type ModsResponse = PaginatedResult<Mod>;

export const getMods = (
    uuid: string,
    category: string,
    page: number,
    pageSize: number,
    searchQuery: string,
    type: string,
    sortBy: string,
    minecraftVersion: string
): Promise<ModsResponse> => {
    return new Promise((resolve, reject) => {
        http.get(`/api/client/servers/${uuid}/mcmods`, {
            params: {
                category: category,
                page: page,
                page_size: pageSize,
                search_query: searchQuery,
                type: type,
                sort_by: sortBy,
                minecraft_version: minecraftVersion,
            },
        })
            .then((response) => {
                const mods = response.data.data.map((item: any) => rawDataToMod(item));
                const pagination = getPaginationSet(response.data.pagination);
                resolve({
                    items: mods,
                    pagination: pagination,
                });
            })
            .catch(reject);
    });
};

export const installMod = (uuid: string, category: string, modId: string | number): Promise<void> => {
    return new Promise((resolve, reject) => {
        http.post(`/api/client/servers/${uuid}/mcmods/install`, {
            category,
            modId,
        })
            .then(() => resolve())
            .catch(reject);
    });
};
