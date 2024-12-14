import tw from 'twin.macro';
import http from '@/api/http';
import { Formik, Form } from 'formik';
import Field from '@/components/elements/Field';
import Select from '@/components/elements/Select';
import React, { useEffect, useState } from 'react';

const SearchRow = ({
    onSearch,
    minecraftVersion,
    setMinecraftVersion,
    category,
    setCategory,
    sortBy,
    setSortBy,
    type,
    setType,
    pageSize,
    setPageSize,
}: {
    onSearch: (searchQuery: string) => void;
    minecraftVersion: string;
    setMinecraftVersion: React.Dispatch<React.SetStateAction<string>>;
    category: string;
    setCategory: React.Dispatch<React.SetStateAction<string>>;
    sortBy: string;
    setSortBy: React.Dispatch<React.SetStateAction<string>>;
    type: string;
    setType: React.Dispatch<React.SetStateAction<string>>;
    pageSize: number;
    setPageSize: React.Dispatch<React.SetStateAction<number>>;
}) => {
    const [minecraftVersions, setMinecraftVersions] = useState<string[]>([]);

    useEffect(() => {
        const fetchMinecraftVersions = async () => {
            const response = await fetch('https://launchermeta.mojang.com/mc/game/version_manifest.json');
            const data = await response.json();

            interface MinecraftVersions {
                id: string;
                type: string;
            }

            const versions = data.versions
                .filter((versionList: MinecraftVersions) => versionList.type === 'release')
                .map((versionList: MinecraftVersions) => versionList.id);

            setMinecraftVersions(versions);
        };

        fetchMinecraftVersions();
    }, []);

    const getSortOptions = (selectedCategory: string) => {
        switch (selectedCategory) {
            case 'modrinth':
                return [
                    { value: 'downloads', label: 'Downloads' },
                    { value: 'newest', label: 'Newest' },
                    { value: 'updated', label: 'Updated' },
                    { value: 'relevance', label: 'Relevance' },
                ];
            case 'curseforge':
                return [
                    { value: '6', label: 'Downloads' },
                    { value: '12', label: 'Ratings' },
                    { value: '2', label: 'Popularity' },
                    { value: '11', label: 'Newest' },
                    { value: '3', label: 'Updated' },
                ];
            default:
                return [];
        }
    };

    const sortOptions = getSortOptions(category);

    return (
        <Formik
            initialValues={{ searchQuery: '' }}
            onSubmit={(values) => {
                onSearch(values.searchQuery);
            }}
        >
            {({ values, handleChange }) => (
                <Form css={tw`w-full`}>
                    <div css={tw`flex flex-col space-y-4 lg:flex-row lg:space-y-0 lg:space-x-4`}>
                        <div css={tw`flex-grow`}>
                            <label css={tw`block mb-1 text-sm`} htmlFor='searchQuery'>
                                Search Mods
                            </label>
                            <Field
                                name={'searchQuery'}
                                placeholder='Search here...'
                                value={values.searchQuery}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                    handleChange(e);
                                    onSearch(e.target.value);
                                }}
                                css={tw`w-full`}
                            />
                        </div>
                        <div css={tw`flex space-x-4`}>
                            <div css={tw`w-full lg:w-24`}>
                                <label css={tw`block mb-1 text-sm`} htmlFor='mcVersion'>
                                    Version
                                </label>
                                <Select
                                    id='mcVersion'
                                    value={minecraftVersion}
                                    onChange={(e) => setMinecraftVersion(e.target.value)}
                                >
                                    <option value=''>Any</option>
                                    {minecraftVersions.map((version) => (
                                        <option key={version} value={version}>
                                            {version}
                                        </option>
                                    ))}
                                </Select>
                            </div>
                            {category === 'modrinth' && (
                                <div css={tw`w-full lg:w-32`}>
                                    <label css={tw`block mb-1 text-sm`} htmlFor='serverType'>
                                        Server Software
                                    </label>
                                    <Select id='serverType' value={type} onChange={(e) => setType(e.target.value)}>
                                        <option value='fabric'>Fabric</option>
                                        <option value='forge'>Forge</option>
                                        <option value='neoforge'>NeoForge</option>
                                        <option value='sponge'>Sponge</option>
                                        <option value='quilt'>Quilt</option>
                                    </Select>
                                </div>
                            )}
                            {category === 'curseforge' && (
                                <div css={tw`w-full lg:w-32`}>
                                    <label css={tw`block mb-1 text-sm`} htmlFor='serverType'>
                                        Server Software
                                    </label>
                                    <Select id='serverType' value={type} onChange={(e) => setType(e.target.value)}>
                                        <option value=''>Any</option>
                                        <option value='4'>Fabric</option>
                                        <option value='1'>Forge</option>
                                        <option value='6'>NeoForge</option>
                                        <option value='5'>Quilt</option>
                                    </Select>
                                </div>
                            )}
                        </div>
                        <div css={tw`flex space-x-4`}>
                            <div css={tw`w-2/5 lg:w-32`}>
                                <label css={tw`block mb-1 text-sm`} htmlFor='sortBy'>
                                    Sort by
                                </label>
                                <Select id='sortBy' value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                                    {sortOptions.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </Select>
                            </div>
                            <div css={tw`w-2/5 lg:w-32`}>
                                <label css={tw`block mb-1 text-sm`} htmlFor='category'>
                                    Provider
                                </label>
                                <Select
                                    id='category'
                                    value={category}
                                    onChange={(e) => {
                                        const newCategory = e.target.value;
                                        setCategory(newCategory);
                                        setSortBy(getSortOptions(newCategory)[0].value);
                                        if (newCategory === 'modrinth') {
                                            setType('fabric');
                                        } else if (newCategory === 'curseforge') {
                                            setType('');
                                        } else {
                                            setMinecraftVersion('');
                                            setType('');
                                        }
                                    }}
                                >
                                    <option value='modrinth'>Modrinth</option>
                                    <option value='curseforge'>Curseforge</option>
                                </Select>
                            </div>
                            <div css={tw`w-1/5 lg:w-16`}>
                                <label css={tw`block mb-1 text-sm`} htmlFor='pageSize'>
                                    Size
                                </label>
                                <Select
                                    id='pageSize'
                                    value={pageSize}
                                    onChange={(e) => setPageSize(parseInt(e.target.value))}
                                >
                                    <option value={6}>6</option>
                                    <option value={12}>12</option>
                                    <option value={24}>24</option>
                                    <option value={48}>48</option>
                                </Select>
                            </div>
                        </div>
                    </div>
                </Form>
            )}
        </Formik>
    );
};

export default SearchRow;
