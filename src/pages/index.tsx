import { GetStaticProps } from 'next';
import Link from 'next/link';
import { useState } from 'react';
import Head from 'next/head';
import Prismic from '@prismicio/client';
import ptBR from 'date-fns/locale/pt-BR';
import { format } from 'date-fns';

import { AiOutlineCalendar } from 'react-icons/ai';
import { FiUser } from 'react-icons/fi';

import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  const [posts, setPosts] = useState(postsPagination.results);
  const [nextPage, setNextPage] = useState(postsPagination.next_page);

  async function handleLoadMorePosts(): Promise<void> {
    if (nextPage) {
      const updatedPosts = [...posts];
      const { next_page } = postsPagination;
      const response = await fetch(next_page);
      const newPosts = await response.json();

      if (newPosts.results.length) {
        updatedPosts.push(...newPosts.results);
        setPosts(updatedPosts);
      }
      setNextPage(newPosts.next_page);
    }
  }

  return (
    <>
      <Head>
        <title>ignblog | Home</title>
      </Head>
      <div className={commonStyles.container}>
        <section className={styles.home}>
          {posts.map(post => (
            <Link href={`post/${post.uid}`} key={post.uid}>
              <a className={styles.post}>
                <h1>{post.data.title}</h1>
                <p>{post.data.subtitle}</p>
                <div className={styles.postInformation}>
                  <span>
                    <AiOutlineCalendar size={20} color="#bbb" />
                    {format(
                      new Date(post.first_publication_date),
                      'dd MMM yyy',
                      {
                        locale: ptBR,
                      }
                    )}
                  </span>
                  <span>
                    <FiUser size={20} color="#bbb" />
                    {post.data.author}
                  </span>
                </div>
              </a>
            </Link>
          ))}
          {nextPage && (
            <button onClick={handleLoadMorePosts} type="button">
              Carregar mais posts
            </button>
          )}
        </section>
      </div>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.Predicates.at('document.type', 'post')],
    { fetch: [], pageSize: 1 }
  );

  const posts = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });

  const postsPagination = {
    next_page: postsResponse.next_page,
    results: posts,
  };

  return {
    props: { postsPagination },
    revalidate: 60 * 60 * 6, // 6 horas
  };
};
